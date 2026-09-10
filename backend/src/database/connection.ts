import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

// Recria a variável __dirname no escopo de ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conexão com o arquivo SQLite
export const db = knex({
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, 'database.sqlite'),
  },
  useNullAsDefault: true,
});