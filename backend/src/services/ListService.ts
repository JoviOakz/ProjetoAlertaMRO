import { db } from '@/database/connection.js';

function formatTimestamp(rawDate: any): string {
    if (!rawDate) return 'N/D';
    const rawStr = String(rawDate).trim();

    const dt = new Date(rawStr);
    if (!isNaN(dt.getTime()) && (rawStr.includes('T') || rawStr.includes('-'))) {
        const dd = String(dt.getUTCDate()).padStart(2, '0');
        const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
        const yyyy = dt.getUTCFullYear();
        const hh = String(dt.getUTCHours()).padStart(2, '0');
        const min = String(dt.getUTCMinutes()).padStart(2, '0');
        const sec = String(dt.getUTCSeconds()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${min}:${sec}`;
    }

    if (rawStr.length === 8 && /^\d+$/.test(rawStr)) {
        const yyyy = rawStr.slice(0, 4);
        const mm = rawStr.slice(4, 6);
        const dd = rawStr.slice(6, 8);
        return `${dd}/${mm}/${yyyy} 00:00:00`;
    }

    return rawStr;
}

export class ListService {
    async execute() {
        const now = new Date();
        const currentMonthPrefix = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0');

        const rawResults = await db.raw(`
            WITH cur_month_totals AS (
                SELECT 
                    material,
                    SUM(total_quantity) as consumoMesAtual,
                    MAX(avg_3m_quantity) as valorMedia3M,
                    MAX(crossing_timestamp_local) as crossing_timestamp_local
                FROM daily
                WHERE substr(movement_date, 1, 6) = ?
                GROUP BY material
            ),
            cur_month_movements AS (
                SELECT 
                    id,
                    material,
                    movement_timestamp,
                    movement_date,
                    total_quantity,
                    avg_3m_quantity,
                    SUM(total_quantity) OVER (
                        PARTITION BY material 
                        ORDER BY COALESCE(movement_timestamp, movement_date) ASC, id ASC
                    ) as cumulative_qty
                FROM daily
                WHERE substr(movement_date, 1, 6) = ?
            ),
            dynamic_crossing AS (
                SELECT 
                    material,
                    COALESCE(movement_timestamp, movement_date) as dynamic_ts,
                    ROW_NUMBER() OVER (
                        PARTITION BY material 
                        ORDER BY COALESCE(movement_timestamp, movement_date) ASC, id ASC
                    ) as rn
                FROM cur_month_movements
                WHERE avg_3m_quantity IS NOT NULL 
                  AND avg_3m_quantity > 0 
                  AND cumulative_qty >= avg_3m_quantity
            ),
            material_meta AS (
                SELECT material, mrp_id,
                    ROW_NUMBER() OVER(PARTITION BY material ORDER BY COALESCE(movement_timestamp, movement_date) DESC) as rn
                FROM daily
                WHERE substr(movement_date, 1, 6) = ?
            )
            SELECT 
                cmt.material as pn,
                COALESCE(mm.mrp_id, 'N/D') as mrp,
                COALESCE(cmt.crossing_timestamp_local, dc.dynamic_ts) as raw_date,
                ROUND(cmt.consumoMesAtual) as consumoMesAtual,
                ROUND(COALESCE(cmt.valorMedia3M, 0)) as valorMedia3M
            FROM cur_month_totals cmt
            LEFT JOIN dynamic_crossing dc ON cmt.material = dc.material AND dc.rn = 1
            LEFT JOIN material_meta mm ON cmt.material = mm.material AND mm.rn = 1
            WHERE cmt.valorMedia3M >= 0 
              AND cmt.consumoMesAtual >= cmt.valorMedia3M
            ORDER BY cmt.consumoMesAtual DESC
            LIMIT 50
        `, [currentMonthPrefix, currentMonthPrefix, currentMonthPrefix]);

        const rows = Array.isArray(rawResults) ? rawResults : (rawResults.rows || []);

        const monthlyTotals = rows.map((item: any) => ({
            pn: item.pn,
            mrp: item.mrp || 'N/D',
            data: formatTimestamp(item.raw_date),
            valorMedia: Math.round(Number(item.valorMedia3M || 0)),
            consumoMesAtual: Math.round(Number(item.consumoMesAtual || 0)),
        }));

        const rawTendencia = await db.raw(`
            WITH cur_month AS (
                SELECT 
                    material,
                    SUM(total_quantity) as consumoMesAtual,
                    MAX(avg_3m_quantity) as valorMedia3M
                FROM daily
                WHERE substr(movement_date, 1, 6) = ?
                GROUP BY material
            ),
            material_mrp AS (
                SELECT material, mrp_id,
                       ROW_NUMBER() OVER(PARTITION BY material ORDER BY movement_date DESC) as rn
                FROM daily
            )
            SELECT 
                cm.material as pn,
                COALESCE(mm.mrp_id, 'N/D') as mrp,
                CASE 
                    WHEN cm.consumoMesAtual > (COALESCE(cm.valorMedia3M, 0) * 1.1) THEN 'Subindo'
                    ELSE 'Estável'
                END as status
            FROM cur_month cm
            LEFT JOIN material_mrp mm ON cm.material = mm.material AND mm.rn = 1
            ORDER BY cm.consumoMesAtual DESC
            LIMIT 50
        `, [currentMonthPrefix]);

        const rowsTendencia = Array.isArray(rawTendencia) ? rawTendencia : (rawTendencia.rows || []);

        return {
            monthlyTotals,
            materiaisTendencia: rowsTendencia.map((m: any) => ({
                pn: m.pn,
                mrp: m.mrp || 'N/D',
                descricao: 'N/D',
                status: m.status
            })),
        };
    }
}