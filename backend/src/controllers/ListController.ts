import { Request, Response } from 'express';

export class ListController {
  async getListaData(req: Request, res: Response) {
    try {
      // Dados para a primeira tabela: MATERIAIS > MÉDIA
      const materiaisMedia = [
        { pn: '123456', mrp: 'M01', descricao: 'Rolamento Especial', valorMedia: 120.5, delta: '+15%' },
        { pn: '789012', mrp: 'M02', descricao: 'Parafuso Sextavado', valorMedia: 45.0, delta: '+8%' },
        { pn: '554433', mrp: 'M01', descricao: 'Graxa Sintética 1Kg', valorMedia: 88.0, delta: '+22%' },
      ];

      // Dados para a segunda tabela: TENDÊNCIA
      const materiaisTendencia = [
        { pn: '345678', mrp: 'M01', descricao: 'Vedações Industriais', status: 'SUBINDO' },
        { pn: '901234', mrp: 'M03', descricao: 'Sensor Óptico', status: 'SUBINDO' },
        { pn: '887766', mrp: 'M02', descricao: 'Filtro Pneumático', status: 'DESCENDO' },
      ];

      // Retorna os dois conjuntos de dados em um único objeto JSON
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