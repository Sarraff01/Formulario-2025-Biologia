// server.js - Versão MongoDB

const express = require('express');
const { MongoClient } = require('mongodb'); // Importa o cliente do MongoDB
const path = require('path');
require('dotenv').config(); // Para carregar variáveis de ambiente localmente

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Habilita o Express a ler JSON no corpo da requisição
app.use(express.static(path.join(__dirname, 'public'))); // Serve arquivos estáticos (HTML, CSS, JS)

// --- Variáveis de Conexão MongoDB ---
// Usa a variável DATABASE_URL fornecida pelo Railway (ou pelo .env local)
const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);

// Nome do banco de dados e da coleção (equivalente a uma tabela)
const DB_NAME = "pesquisa_db"; 
const COLLECTION_NAME = "respostas"; 

// Variável para armazenar a conexão com o banco de dados
let db; 

// Função de Conexão
async function connectToDatabase() {
    try {
        console.log("Conectando ao MongoDB Atlas...");
        await client.connect();
        db = client.db(DB_NAME);
        console.log("Conexão com o MongoDB Atlas estabelecida com sucesso!");
    } catch (err) {
        console.error("Erro ao conectar ao MongoDB:", err);
        // Em caso de falha crítica, encerra o servidor
        process.exit(1);
    }
}

// Rota POST para receber os dados do formulário
app.post('/api/respostas', async (req, res) => {
    const resposta = req.body;
    
    // Adiciona o timestamp antes de salvar
    const dataComTimestamp = {
        ...resposta,
        timestamp_cadastro: new Date()
    };
    
    console.log("Dados recebidos para inserção:", dataComTimestamp);

    if (!db) {
        // Se a conexão ainda não estiver pronta, retorna erro 503
        return res.status(503).json({ error: "Serviço indisponível. Conexão com o banco de dados não estabelecida." });
    }

    try {
        // 1. Acessa a coleção (se ela não existir, o MongoDB a cria automaticamente)
        const collection = db.collection(COLLECTION_NAME);
        
        // 2. Insere o documento (a resposta completa)
        const result = await collection.insertOne(dataComTimestamp);

        console.log(`Resposta salva com sucesso! ID: ${result.insertedId}`);
        res.status(201).json({ 
            message: "Pesquisa salva com sucesso no MongoDB!",
            id: result.insertedId
        });

    } catch (error) {
        console.error("Erro ao inserir dados no MongoDB:", error);
        res.status(500).json({ error: "Erro interno do servidor ao salvar a pesquisa." });
    }
});

// Inicializa o servidor
connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
        console.log(`Acesse: http://localhost:${PORT}`);
    });
});
