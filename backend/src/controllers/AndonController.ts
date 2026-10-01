import { Request, Response } from 'express';
import { db } from '@/database/connection.js';

export class AndonController {

    // Rota GET: Buscar os dados (que já fizemos)
    async getAndonData(req: Request, res: Response) {
        try {
            const { partNumber, status } = req.query;
            const now = new Date();
            const currentMonthPrefix = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0');

            let query = db('andon').where('mes_referencia', currentMonthPrefix);

            if (partNumber) {
                query = query.andWhere('material', 'like', `%${partNumber}%`);
            }
            if (status) {
                query = query.andWhere('status', 'like', `%${status}%`);
            }

            const registros = await query.orderBy('data_alerta', 'desc');

            const andonItems = registros.map((item: any) => ({
                id: item.id,
                partNumber: item.material,
                mrp: item.mrp_id,
                dataAlerta: item.data_alerta,
                consumoAtual: item.consumo_atual,
                limitePermitido: item.limite_permitido,
                status: item.status,
            }));

            return res.json(andonItems);
        } catch (error) {
            console.error('Erro ao buscar dados do Andon:', error);
            return res.status(500).json({ error: 'Erro ao buscar dados do Andon' });
        }
    }

    // Rota POST: Resolver o Andon (Mover para o Histórico)
    async resolverAndon(req: Request, res: Response) {
        // Recebe o ID da linha do Andon pela URL e a observação do body
        const { id } = req.params;
        const { observacao } = req.body;

        try {
            // Inicia a transação de banco de dados
            await db.transaction(async (trx) => {
                // 1. Busca o registro atual na tabela Andon
                const andonItem = await trx('andon').where({ id }).first();

                if (!andonItem) {
                    throw new Error('Item não encontrado no Andon.');
                }

                const agora = new Date();
                // Ajuste de fuso horário local (UTC-3)
                agora.setHours(agora.getHours() - 3);

                // 2. Insere na tabela histórico
                await trx('historico').insert({
                    material: andonItem.material,
                    mrp_id: andonItem.mrp_id,
                    mes_referencia: andonItem.mes_referencia,
                    data_alerta: andonItem.data_alerta,
                    data_conclusao: agora.toISOString(),
                    observacao_planejador: observacao || 'Concluído sem observações' // Caso o planejador não escreva nada
                });

                // 3. Remove da tabela Andon
                await trx('andon').where({ id }).del();
            });

            return res.status(200).json({
                sucesso: true,
                message: 'Item resolvido e movido para o histórico com sucesso!'
            });

        } catch (error: any) {
            console.error('Erro ao resolver item do Andon:', error);

            // Tratamento de erro para caso o item não exista
            if (error.message === 'Item não encontrado no Andon.') {
                return res.status(404).json({ error: error.message });
            }

            return res.status(500).json({ error: 'Erro interno ao resolver o item.' });
        }
    }
}