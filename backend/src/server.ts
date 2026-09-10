import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

// Inicializa o Oracle Client em Thick Mode obrigatoriamente antes de qualquer outra operação
try {
  oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_23_0' });
  console.log('Oracle Client inicializado em Thick Mode com sucesso.');
} catch (err) {
  console.error('Falha ao iniciar Oracle Thick Mode:', err);
}

import app from './app.js';
import { initDb } from './database/initDB.js';

const PORT = process.env.PORT || 3333;

initDb()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor backend rodando em http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Erro ao inicializar o banco de dados:', error);
    });