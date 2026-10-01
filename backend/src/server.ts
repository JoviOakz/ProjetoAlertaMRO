import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

// Thick mode para inicialização do Oracle
try {
    oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_23_0' });
    console.log('Oracle Client inicializado em Thick Mode com sucesso.');
} catch (err) {
    console.error('Falha ao iniciar Oracle Thick Mode:', err);
}

import app from './app.js';
import { initDb } from './database/initDB.js';
import { SyncService } from '@/services/SyncServices.js';

const PORT = process.env.PORT || 3333;

initDb().then(async () => {
    app.listen(PORT, async () => {
        console.log(`Servidor backend rodando em http://localhost:${PORT}`);

        // Sincronização automática na subida do backend
        try {
            const syncService = new SyncService();
            await syncService.executeSync();
        } catch (syncError) {
            console.error('❌ Erro na sincronização inicial do backend:', syncError);
        }
    });
}).catch((error) => {
    console.error('Erro ao inicializar o banco de dados:', error);
});