import oracledb from 'oracledb';
import { db } from '../database/connection.js';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

export class SyncService {
    async executeSync(): Promise<void> {
        let connection: oracledb.Connection | null = null;

        try {
            console.log('🔄 Iniciando sincronização com o Redlake...');

            connection = await oracledb.getConnection({
                user: process.env.ORACLE_USER || 'MAO8CT',
                password: process.env.ORACLE_PASSWORD || '49l1)f=f3q6A',
                connectString: process.env.ORACLE_CONN_STRING || 'REDLake_ZeusP_Consumer_Common.world',
            });

            const mainQuery = `
                WITH base AS (
                    SELECT DISTINCT
                        MSEG.matnr                 AS material,
                        MSEG.mblnr                 AS material_doc,
                        MARA.mtart                 AS material_type,
                        MSEG.bwart                 AS move_type,
                        CASE
                            WHEN MSEG.bwart IN ('201', '221', '261', '281', '963')
                                THEN ABS(MSEG.menge)
                            WHEN MSEG.bwart IN ('102', '202', '222', '262', '928', '101')
                                THEN -ABS(MSEG.menge)
                        END                        AS quantity,
                        MSEG.meins                 AS unity,
                        MSEG.aufnr                 AS order_number,
                        MSEG.dmbtr                 AS price,
                        MSEG.budat_mkpf            AS doc_date,
                        MSEG.tech_timestamp_number AS tech_timestamp,
                        MDKP.dispo                 AS mrp_id
                    FROM MARD_MDNA.V_CUSN_MSEG_B2 MSEG
                    INNER JOIN MARD_DALI_BBM.MARA_PS0 MARA
                        ON MSEG.matnr = MARA.matnr
                    INNER JOIN MARD_MDNA.V_CUSN_MDKP_B2 MDKP
                        ON MSEG.matnr = MDKP.matnr
                    WHERE MARA.mtart IN ('HIBE', 'FHMI')
                    AND MSEG.lgort = '6821'
                    AND MSEG.bwart IN ('201', '221', '261', '281', '963', '101', '102', '202', '222', '262', '928')
                    AND MSEG.budat_mkpf >= TO_CHAR(ADD_MONTHS(TRUNC(SYSDATE), -12), 'YYYYMMDD')
                    AND MSEG.budat_mkpf <= TO_CHAR(TRUNC(SYSDATE), 'YYYYMMDD')
                    AND MDKP.dispo IN (
                        'IBC', 'IBV', 'ILQ', 'IN1', 'IN2', 
                        'IN3', 'IN4', 'IN5', 'IN8', 'IN9', 
                        'MSW', 'UI0', 'UI6', 'UN0', 'UN6', 'NOV'
                    )
                )
                SELECT
                    material               AS "material",
                    doc_date               AS "movement_date",
                    SUM(quantity)          AS "total_quantity",
                    MAX(tech_timestamp)   AS "last_tech_timestamp",
                    mrp_id                 AS "mrp_id"
                FROM base
                GROUP BY material, doc_date, mrp_id
                ORDER BY material, doc_date
            `;

            const result = await connection.execute(mainQuery);
            const rows = (result.rows as any[]) || [];

            console.log(`📊 ${rows.length} registros retornados do Redlake. Atualizando banco local...`);

            await db.transaction(async (trx) => {
                await trx('materiais_movimentacoes').del();

                const chunkSize = 500;
                for (let i = 0; i < rows.length; i += chunkSize) {
                    const chunk = rows.slice(i, i + chunkSize);
                    await trx('materiais_movimentacoes').insert(chunk);
                }
            });

            console.log('Sincronização concluída com sucesso!');
        } catch (error) {
            console.error('Erro durante a sincronização:', error);
            throw error;
        } finally {
            if (connection) {
                await connection.close();
            }
        }
    }
}