import { db } from './connection.js';

export async function initDb() {
    // Tabela para guardar os dados de movimentações dos últimos 12 meses trazidos da Query
    const hasTableMovimentacoes = await db.schema.hasTable('materiais_movimentacoes');

    if (!hasTableMovimentacoes) {
        await db.schema.createTable('materiais_movimentacoes', (table) => {
            table.increments('id').primary();
            table.string('material').notNullable();        // Ex: PN / código do material (matnr)
            table.string('movement_date').notNullable();   // Data do documento (YYYYMMDD)
            table.decimal('total_quantity', 12, 3);        // Quantidade total movimentada no dia
            table.string('last_tech_timestamp');           // Para controle de ordenação/controle técnico
            table.string('mrp_id');                        // Planejador MRP (dispo)
            table.timestamp('created_at').defaultTo(db.fn.now());

            // Índices para deixar as buscas do Dashboard e Lista instantâneas
            table.index(['material']);
            table.index(['movement_date']);
            table.index(['mrp_id']);
        });
    }

    console.log('Banco de dados local (SQLite) inicializado com sucesso.');
}