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

        // Busca direto da tabela ANDON cruzando com os totais! Fica muito mais rápido.
        const rawResults = await db.raw(`
            SELECT 
                a.material as pn,
                a.mrp_id as mrp,
                a.data_alerta as raw_date,
                a.consumo_atual as consumoMesAtual,
                a.limite_permitido as limitePermitido,
                a.status
            FROM andon a
            WHERE a.mes_referencia = ?
            ORDER BY a.consumo_atual DESC
            LIMIT 50
        `, [currentMonthPrefix]);

        const rows = Array.isArray(rawResults) ? rawResults : (rawResults.rows || []);

        const monthlyTotals = rows.map((item: any) => ({
            pn: item.pn,
            mrp: item.mrp,
            data: formatTimestamp(item.raw_date),
            limitePermitido: Math.round(Number(item.limitePermitido || 0)),
            consumoMesAtual: Math.round(Number(item.consumoMesAtual || 0)),
            statusAndon: item.status
        }));

        // Mantém a tendência como você fez (podemos evoluir depois)
        const rawTendencia = await db.raw(`
            WITH cur_month AS (
                SELECT material, SUM(total_quantity) as consumoMesAtual, MAX(threshold_quantity) as limitePermitido
                FROM daily WHERE substr(movement_date, 1, 6) = ? GROUP BY material
            )
            SELECT cm.material as pn, cm.consumoMesAtual, cm.limitePermitido,
                   CASE WHEN cm.consumoMesAtual > cm.limitePermitido THEN 'Alerta' ELSE 'Estável' END as status
            FROM cur_month cm
            ORDER BY cm.consumoMesAtual DESC LIMIT 50
        `, [currentMonthPrefix]);

        const rowsTendencia = Array.isArray(rawTendencia) ? rawTendencia : (rawTendencia.rows || []);

        return {
            monthlyTotals,
            materiaisTendencia: rowsTendencia.map((m: any) => ({
                pn: m.pn,
                mrp: 'N/D',
                descricao: 'N/D',
                status: m.status
            })),
        };
    }
}