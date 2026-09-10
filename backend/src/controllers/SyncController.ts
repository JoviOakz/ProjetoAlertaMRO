import { Request, Response } from 'express';
import { SyncService } from '@/services/SyncServices.js';

export class SyncController {
    async handle(req: Request, res: Response): Promise<Response> {
        try {
            const syncService = new SyncService();
            await syncService.executeSync();

            return res.status(200).json({ message: 'Sincronização realizada com sucesso!' });
        } catch (error) {
            console.error('Erro na rota de sync:', error);
            return res.status(500).json({ error: 'Falha ao sincronizar com o Redlake.' });
        }
    }
}