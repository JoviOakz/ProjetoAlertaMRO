import { db } from './connection.js';

export async function initDb() {
    const hasDaily = await db.schema.hasTable('daily');
    if (!hasDaily) {
        await db.schema.createTable('daily', (table) => {
            table.increments('id').primary();
            table.string('material').notNullable();         // PN / código do material
            table.string('movement_date').notNullable();    // Data do documento (YYYYMMDD)
            table.decimal('total_quantity', 12, 3);         // Quantidade total movimentada
            table.string('last_tech_timestamp');            // Controle técnico raw
            table.datetime('movement_timestamp');           // Timestamp convertido
            table.string('mrp_id');                         // Planejador MRP
            table.string('index_key').unique();             // Índice composto único
            table.decimal('avg_3m_quantity', 12, 3);        // Média de consumo dos últimos 3 meses
            table.datetime('crossing_timestamp_local');     // Timestamp exato do cruzamento da meta
            table.timestamp('created_at').defaultTo(db.fn.now());

            table.index(['material']);
            table.index(['movement_date']);
            table.index(['mrp_id']);
        });
    }

    console.log('Tabela inicializada com sucesso.');
}