import { Request, Response } from 'express';
import { db } from '@/database/connection.js';

export class ListController {
  async getListaData(req: Request, res: Response) {
    try {
      const registros = await db('materiais_movimentacoes').select('*');

      const materiaisMedia = registros.slice(0, 20).map((item: any) => ({
        pn: item.material,
        mrp: item.mrp_id,
        descricao: item.descricao || 'N/D',
        valorMedia: item.total_quantity || 0,
        delta: '0%'
      }));

      const materiaisTendencia = registros.slice(20, 40).map((item: any) => ({
        pn: item.material,
        mrp: item.mrp_id,
        descricao: item.descricao || 'N/D',
        status: 'ESTÁVEL'
      }));

      return res.json({
        materiaisMedia,
        materiaisTendencia,
      });
    } catch (error) {
      console.error('Erro ao buscar dados da lista:', error);
      return res.status(500).json({ error: 'Erro ao buscar dados da lista' });
    }
  }
}