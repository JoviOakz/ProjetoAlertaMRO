import { Request, Response } from 'express';
import { ListService } from '@/services/ListService.js';

export class ListController {
    async getListaData(req: Request, res: Response): Promise<Response> {
        try {
            const listService = new ListService();
            const result = await listService.execute();

            return res.status(200).json({
                materiaisMedia: result.monthlyTotals.map((item: any) => ({
                    pn: item.pn,
                    mrp: item.mrp,
                    data: item.data,
                    valorMedia: item.valorMedia,
                    consumoMesAtual: item.consumoMesAtual
                })),
                materiaisTendencia: result.materiaisTendencia
            });
        } catch (error) {
            console.error('Erro ao buscar dados da lista:', error);
            return res.status(500).json({ error: 'Erro ao buscar dados da lista' });
        }
    }
}