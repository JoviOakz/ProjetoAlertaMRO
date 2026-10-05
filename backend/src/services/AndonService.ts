import { db } from '@/database/connection.js';

export class AndonService {
    // Lista os itens do Andon
    async execute() {
        const now = new Date();
        const currentMonthPrefix = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0');

        const rawResults = await db.raw(`
            SELECT 
                a.material AS partNumber,
                COALESCE(NULLIF(a.description, ''), 'Sem Descrição') AS description,
                COALESCE(NULLIF(a.mrp_id, ''), 'N/D') AS responsavel,
                COALESCE(a.comentarios, '') AS comentarios,
                COALESCE(a.status_tratativa, 'Nenhuma ação') AS status
            FROM andon a
            WHERE a.mes_referencia = ?
            ORDER BY a.consumo_atual DESC
        `, [currentMonthPrefix]);

        const rows = Array.isArray(rawResults) ? rawResults : (rawResults.rows || []);

        return rows.map((item: any) => ({
            partNumber: item.partNumber,
            description: item.description || 'N/D',
            responsavel: item.responsavel || 'N/D',
            comentarios: item.comentarios || '',
            status: item.status || 'Nenhuma ação'
        }));
    }

    // Atualiza o comentário e o status de um item específico
    async update(partNumber: string, comentarios: string, status: string) {
        const now = new Date();
        const currentMonthPrefix = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0');

        await db.raw(`
            UPDATE andon 
            SET comentarios = ?, status_tratativa = ?
            WHERE material = ? AND mes_referencia = ?
        `, [comentarios, status, partNumber, currentMonthPrefix]);

        return { success: true, message: 'Andon atualizado com sucesso' };
    }
}