import { Request, Response } from 'express';

export class AndonController {
    async getAndonData(req: Request, res: Response) {
        try {
            const { partNumber, status } = req.query;

            let andonItems = [
                {
                    partNumber: 'F000.899.4VR',
                    descricao: 'FOLHA A4',
                    status: '01/09: PO em processamento',
                    responsavel: 'Hallyessa',
                },
                {
                    partNumber: 'F000.899.5AB',
                    descricao: 'GRAXA LUBRIFICANTE',
                    status: '02/09: Material Entregue',
                    responsavel: 'Carlos',
                },
            ];

            // Filtra caso o usuário passe query params na requisição
            if (partNumber) {
                andonItems = andonItems.filter(item =>
                    item.partNumber.toLowerCase().includes(String(partNumber).toLowerCase())
                );
            }

            if (status) {
                andonItems = andonItems.filter(item =>
                    item.status.toLowerCase().includes(String(status).toLowerCase())
                );
            }

            return res.json(andonItems);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar dados do Andon' });
        }
    }
}