import { db } from './connection.js';

export async function initDb() {
    // 1. TABELA DAILY (Atualizada)
    const hasDaily = await db.schema.hasTable('daily');
    if (!hasDaily) {
        await db.schema.createTable('daily', (table) => {
            table.increments('id').primary();
            table.string('material').notNullable();
            table.string('movement_date').notNullable();
            table.decimal('total_quantity', 12, 3);
            table.string('last_tech_timestamp');
            table.datetime('movement_timestamp');
            table.string('mrp_id');
            table.string('index_key').unique();
            table.decimal('avg_3m_quantity', 12, 3);
            table.decimal('threshold_quantity', 12, 3); // NOVO: O limite com o "chorinho"
            table.datetime('crossing_timestamp_local');
            table.timestamp('created_at').defaultTo(db.fn.now());

            table.index(['material']);
            table.index(['movement_date']);
            table.index(['mrp_id']);
        });
    }

    // 2. TABELA ANDON (Fila de trabalho dinâmica)
    const hasAndon = await db.schema.hasTable('andon');
    if (!hasAndon) {
        await db.schema.createTable('andon', (table) => {
            table.increments('id').primary();
            table.string('material').notNullable();
            table.string('mrp_id');
            table.string('mes_referencia').notNullable(); // ex: 202610
            table.datetime('data_alerta').notNullable(); // Quando estourou o limite
            table.decimal('consumo_atual', 12, 3);
            table.decimal('limite_permitido', 12, 3);
            table.string('status').defaultTo('Pendente'); // Pendente, Em Análise
            table.timestamp('created_at').defaultTo(db.fn.now());
            
            // Evita duplicidade do mesmo material no mesmo mês no Andon
            table.unique(['material', 'mes_referencia']); 
        });
    }

    // 3. TABELA HISTÓRICO (Registro do que já foi resolvido)
    const hasHistorico = await db.schema.hasTable('historico');
    if (!hasHistorico) {
        await db.schema.createTable('historico', (table) => {
            table.increments('id').primary();
            table.string('material').notNullable();
            table.string('mrp_id');
            table.string('mes_referencia').notNullable();
            table.datetime('data_alerta');
            table.datetime('data_conclusao').notNullable(); // Quando foi resolvido
            table.string('observacao_planejador'); // Pra justificar o motivo
            table.timestamp('created_at').defaultTo(db.fn.now());
        });
    }

    console.log('Tabelas inicializadas com sucesso.');
}