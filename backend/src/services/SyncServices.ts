import oracledb from 'oracledb';
import { db } from '@/database/connection.js';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let isSyncing = false;

function parseMovementTimestamp(rawTimestamp: string | null): Date | null {
    if (!rawTimestamp) return null;
    const t = String(rawTimestamp).padStart(17, '0');
    try {
        const ano = parseInt(t.slice(0, 4), 10);
        const mes = parseInt(t.slice(4, 6), 10);
        const dia = parseInt(t.slice(6, 8), 10);
        const hora = parseInt(t.slice(8, 10), 10);
        const min = parseInt(t.slice(10, 12), 10);
        const seg = parseInt(t.slice(12, 14), 10);
        const ms = parseInt(t.slice(14, 17), 10);
        const segArredondado = Math.round(seg + ms / 1000);
        return new Date(Date.UTC(ano, mes - 1, dia, hora, min, segArredondado));
    } catch {
        return null;
    }
}

export class SyncService {
    async executeSync(): Promise<void> {
        if (isSyncing) {
            console.log('⚠️ Sincronização já está em andamento. Ignorando chamada duplicada.');
            return;
        }

        isSyncing = true;
        let connection: oracledb.Connection | null = null;

        try {
            console.log('🔄 Iniciando sincronização com o Redlake...');

            connection = await oracledb.getConnection({
                user: process.env.ORACLE_USER || 'MAO8CT',
                password: process.env.ORACLE_PASSWORD || '49l1)f=f3q6A',
                connectString: process.env.ORACLE_CONN_STRING || 'REDLake_ZeusP_Consumer_Common.world',
            });

            // QUERY ORACLE COM JOIN DA MAKT_PS0 (Descrição em Português)
            const mainQuery = `
                WITH base AS (
                    SELECT DISTINCT
                        MSEG.matnr AS material,
                        MAKT.maktx AS description,
                        MSEG.mblnr AS material_doc,
                        MARA.mtart AS material_type,
                        MSEG.bwart AS move_type,
                        ABS(MSEG.menge) AS quantity,
                        MSEG.meins AS unity,
                        MSEG.aufnr AS order_number,
                        MSEG.dmbtr AS price,
                        MSEG.budat_mkpf AS doc_date,
                        MSEG.tech_timestamp_number AS tech_timestamp,
                        MDKP.dispo AS mrp_id
                    FROM MARD_MDNA.V_CUSN_MSEG_B2 MSEG
                    INNER JOIN MARD_DALI_BBM.MARA_PS0 MARA ON MSEG.matnr = MARA.matnr
                    INNER JOIN MARD_MDNA.V_CUSN_MDKP_B2 MDKP ON MSEG.matnr = MDKP.matnr
                    LEFT JOIN MARD_DALI_BBM.MAKT_PS0 MAKT ON MSEG.matnr = MAKT.matnr AND MAKT.spras = 'P'
                    WHERE MARA.mtart IN ('HIBE', 'FHMI')
                      AND MSEG.lgort = '6821'
                      AND MSEG.bwart IN ('201', '221', '261', '281', '963')
                      AND MSEG.budat_mkpf >= TO_CHAR(ADD_MONTHS(TRUNC(SYSDATE), -12), 'YYYYMMDD')
                      AND MSEG.budat_mkpf <= TO_CHAR(TRUNC(SYSDATE), 'YYYYMMDD')
                      AND MDKP.dispo IN (
                          'IBC', 'IBV', 'ILQ', 'IN1', 'IN2', 
                          'IN3', 'IN4', 'IN5', 'IN8', 'IN9', 
                          'MSW', 'UI0', 'UI6', 'UN0', 'UN6', 'NOV'
                      )
                )
                SELECT
                    material AS "material",
                    MAX(description) AS "description",
                    doc_date AS "movement_date",
                    SUM(quantity) AS "total_quantity",
                    MAX(tech_timestamp) AS "last_tech_timestamp",
                    mrp_id AS "mrp_id"
                FROM base
                GROUP BY material, doc_date, mrp_id
                ORDER BY material, doc_date
            `;

            const result = await connection.execute(mainQuery);
            const rows = (result.rows as any[]) || [];

            console.log(`📊 ${rows.length} registros retornados. Gravando no SQLite...`);

            await db.transaction(async (trx) => {
                await trx('daily').del();

                const uniqueMap = new Map();
                rows.forEach((r) => {
                    const parsedTs = parseMovementTimestamp(r.last_tech_timestamp);

                    let timestampText = '';
                    if (parsedTs) {
                        const dd = String(parsedTs.getUTCDate()).padStart(2, '0');
                        const mm = String(parsedTs.getUTCMonth() + 1).padStart(2, '0');
                        const yyyy = parsedTs.getUTCFullYear();
                        const hh = String(parsedTs.getUTCHours()).padStart(2, '0');
                        const min = String(parsedTs.getUTCMinutes()).padStart(2, '0');
                        const sec = String(parsedTs.getUTCSeconds()).padStart(2, '0');
                        timestampText = `${dd}/${mm}/${yyyy} ${hh}:${min}:${sec}`;
                    }

                    const indexKey = `${r.material}_${timestampText}`;

                    if (!uniqueMap.has(indexKey)) {
                        uniqueMap.set(indexKey, {
                            material: r.material,
                            description: r.description || 'Sem Descrição',
                            movement_date: r.movement_date,
                            total_quantity: r.total_quantity,
                            last_tech_timestamp: r.last_tech_timestamp ? String(r.last_tech_timestamp) : null,
                            movement_timestamp: parsedTs ? parsedTs.toISOString() : null,
                            mrp_id: r.mrp_id,
                            index_key: indexKey,
                            avg_3m_quantity: null,
                            threshold_quantity: null,
                            crossing_timestamp_local: null,
                        });
                    }
                });

                const formattedDaily = Array.from(uniqueMap.values());
                const chunkSize = 500;
                for (let i = 0; i < formattedDaily.length; i += chunkSize) {
                    await trx('daily').insert(formattedDaily.slice(i, i + chunkSize));
                }

                // 1. Média dos 3 meses (Fixa divisão por 3)
                const now = new Date();
                const targetMonths: string[] = [];
                for (let i = 1; i <= 3; i++) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const yyyymm = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0');
                    targetMonths.push(yyyymm);
                }

                const avgComputed = await trx.raw(`
                    WITH monthly_sums AS (
                        SELECT 
                            material,
                            substr(movement_date, 1, 6) as mes,
                            SUM(total_quantity) as qtd_mes
                        FROM daily
                        WHERE substr(movement_date, 1, 6) IN (?, ?, ?)
                        GROUP BY material, substr(movement_date, 1, 6)
                    ),
                    media_calculada AS (
                        SELECT 
                            material,
                            ROUND(SUM(qtd_mes) / 3.0, 3) as avg_3m_quantity
                        FROM monthly_sums
                        GROUP BY material
                    )
                    SELECT 
                        material,
                        avg_3m_quantity,
                        CASE 
                            WHEN avg_3m_quantity <= 2 THEN avg_3m_quantity + 2
                            WHEN avg_3m_quantity <= 10 THEN avg_3m_quantity * 1.5
                            WHEN avg_3m_quantity <= 50 THEN avg_3m_quantity * 1.2
                            ELSE avg_3m_quantity * 1.1
                        END as threshold_quantity
                    FROM media_calculada
                `, targetMonths);

                const rowsAvg = Array.isArray(avgComputed) ? avgComputed : (avgComputed.rows || []);
                for (const item of rowsAvg) {
                    await trx('daily')
                        .where('material', item.material)
                        .update({
                            avg_3m_quantity: Number(item.avg_3m_quantity) || 0,
                            threshold_quantity: Number(item.threshold_quantity) || 0
                        });
                }

                // 2. Disparo do Alerta ANDON (Gravando também a descrição)
                const currentMonthPrefix = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0');

                const crossingComputed = await trx.raw(`
                    WITH cur_month_movements AS (
                        SELECT 
                            id, material, description, movement_timestamp, movement_date, total_quantity, threshold_quantity, avg_3m_quantity, mrp_id,
                            SUM(total_quantity) OVER (
                                PARTITION BY material 
                                ORDER BY COALESCE(movement_timestamp, movement_date) ASC, id ASC
                            ) as cumulative_qty
                        FROM daily
                        WHERE substr(movement_date, 1, 6) = ?
                        AND total_quantity > 0
                    ),
                    crossing_events AS (
                        SELECT 
                            material, description, mrp_id, threshold_quantity, avg_3m_quantity, cumulative_qty,
                            COALESCE(movement_timestamp, movement_date) as crossing_ts,
                            ROW_NUMBER() OVER (
                                PARTITION BY material 
                                ORDER BY COALESCE(movement_timestamp, movement_date) ASC, id ASC
                            ) as rn
                        FROM cur_month_movements
                        WHERE (COALESCE(threshold_quantity, 0) > 0 AND cumulative_qty > threshold_quantity)
                    )
                    SELECT material, description, mrp_id, threshold_quantity, avg_3m_quantity, cumulative_qty, crossing_ts
                    FROM crossing_events
                    WHERE rn = 1
                `, [currentMonthPrefix]);

                const rowsCrossing = Array.isArray(crossingComputed) ? crossingComputed : (crossingComputed.rows || []);

                for (const item of rowsCrossing) {
                    let localTs: string | null = item.crossing_ts;

                    if (localTs) {
                        const dateObj = new Date(localTs);
                        if (!isNaN(dateObj.getTime())) {
                            dateObj.setHours(dateObj.getHours() - 3);
                            localTs = dateObj.toISOString();
                        }
                    }

                    await trx('daily')
                        .where('material', item.material)
                        .update({ crossing_timestamp_local: localTs });

                    const resolvido = await trx('historico')
                        .where({ material: item.material, mes_referencia: currentMonthPrefix })
                        .first();

                    if (!resolvido) {
                        await trx.raw(`
                            INSERT INTO andon (material, description, mrp_id, mes_referencia, data_alerta, consumo_atual, media_3m, limite_permitido)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            ON CONFLICT(material, mes_referencia) DO UPDATE SET 
                            description = excluded.description,
                            mrp_id = excluded.mrp_id, -- <--- Adicionado aqui
                            consumo_atual = excluded.consumo_atual,
                            media_3m = excluded.media_3m,
                            limite_permitido = excluded.limite_permitido
                        `, [
                            item.material,
                            item.description || 'Sem Descrição',
                            item.mrp_id || 'N/D',
                            currentMonthPrefix,
                            localTs,
                            item.cumulative_qty,
                            item.avg_3m_quantity,
                            item.threshold_quantity
                        ]);
                    }
                }
            });

            console.log('Sincronização finalizada com sucesso!');
        } catch (error) {
            console.error('Erro na sync:', error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
            }
            isSyncing = false;
        }
    }
}