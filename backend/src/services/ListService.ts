import { db } from '@/database/connection.js';

export class ListService {
    async execute() {
        // 1. Materiais com consumo acima da média ou maior volume acumulado
        const materiaisMedia = await db('materiais_movimentacoes')
            .select(
                'material as pn',
                'mrp_id as mrp',
                db.raw('ROUND(AVG(total_quantity), 2) as valorMedia'),
                db.raw('ROUND(SUM(total_quantity), 2) as totalConsumo')
            )
            .groupBy('material', 'mrp_id')
            .orderBy('totalConsumo', 'desc')
            .limit(50);

        // 2. Análise de tendência (compara a movimentação mais recente com a média histórica)
        const materiaisTendencia = await db('materiais_movimentacoes')
            .select(
                'material as pn',
                'mrp_id as mrp',
                db.raw(`
          CASE 
            WHEN SUM(total_quantity) > (AVG(total_quantity) * 1.2) THEN 'SUBINDO'
            ELSE 'ESTAVEL'
          END as status
        `)
            )
            .groupBy('material', 'mrp_id')
            .limit(50);

        return {
            materiaisMedia,
            materiaisTendencia,
        };
    }
}