import app from '@/app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
    console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});