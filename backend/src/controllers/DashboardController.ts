import { Request, Response } from 'express';

export class DashboardController {
    async getDashboardData(req: Request, res: Response) {
        try {
            const dashboardData = {
                alertasPorMes: {
                    labels: ['JAN', 'FEV', 'MAR', 'ABR', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'],
                    valores: [78, 60, 45, 30, 40, 33, 45, 55, 46, 68, 66],
                },
                statusAlertas: {
                    labels: ['SEM TRATATIVA', 'EM ANDAMENTO', 'CONCLUÍDO'],
                    valores: [15.8, 26.3, 57.9],
                },
                alertasPorTipo: {
                    labels: ['HIBE', 'FHMI', 'MAZE'],
                    valores: [15.8, 26.3, 57.9],
                },
            };

            return res.json(dashboardData);
        } catch (error) {
            console.error('Erro ao buscar dados do Dashboard:', error);
            return res.status(500).json({ error: 'Erro ao carregar dados do Dashboard' });
        }
    }
}