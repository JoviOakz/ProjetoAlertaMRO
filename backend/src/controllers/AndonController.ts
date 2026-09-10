import { Request, Response } from 'express';
import { db } from '../database/connection.js';

export class AndonController {
    async getAndonData(req: Request, res: Response) {
        try {
            const { partNumber, status } = req.query;

            // Busca os registros reais da tabela local sincronizada
            const registros = await db('materiais_movimentacoes').select('*');

            // Mapeia os dados do banco para o formato esperado pelo front-end do Andon
            let andonItems = registros.slice(0, 20).map((item: any) => ({
                partNumber: item.material,
                descricao: item.descricao || 'Descrição não informada',
                status: item.status || 'Pendente',
                responsavel: item.responsavel || 'Não atribuído',
            }));

            // Filtra caso o usuário passe query params na requisição
            if (partNumber) {
                andonItems = andonItems.filter(item =>
                    item.partNumber?.toLowerCase().includes(String(partNumber).toLowerCase())
                );
            }

            if (status) {
                andonItems = andonItems.filter(item =>
                    item.status?.toLowerCase().includes(String(status).toLowerCase())
                );
            }

            return res.json(andonItems);
        } catch (error) {
            console.error('Erro ao buscar dados do Andon:', error);
            return res.status(500).json({ error: 'Erro ao buscar dados do Andon' });
        }
    }
}