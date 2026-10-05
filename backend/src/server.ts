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

        const syncService = new SyncService();

        // 1. Sincronização inicial na subida do backend
        try {
            await syncService.executeSync();
        } catch (syncError) {
            console.error('❌ Erro na sincronização inicial do backend:', syncError);
        }

        // 2. Sincronização periódica a cada 1 hora (3.600.000 ms)
        const UMA_HORA_EM_MS = 1000 * 60 * 60;
        setInterval(async () => {
            console.log('Executando sincronização automática periódica...');
            try {
                await syncService.executeSync();
            } catch (periodicSyncError) {
                console.error('❌ Erro na sincronização periódica do backend:', periodicSyncError);
            }
        }, UMA_HORA_EM_MS);
    });
}).catch((error) => {
    console.error('Erro ao inicializar o banco de dados:', error);
});