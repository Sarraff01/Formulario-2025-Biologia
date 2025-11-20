// server.js - Versão FINAL para MongoDB Atlas e Render

const express = require('express');
const { MongoClient } = require('mongodb'); // Importa o cliente oficial do MongoDB
const path = require('path');
require('dotenv').config(); // Usado apenas para carregar variáveis de ambiente localmente (durante o desenvolvimento)

const app = express();
// Usa a porta fornecida pelo ambiente de hospedagem (Render) ou 3000 localmente
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Habilita o Express a ler JSON no corpo da requisição
app.use(express.static(path.join(__dirname, 'public'))); // Serve arquivos estáticos (HTML, CSS, JS)

// --- Configuração de Conexão MongoDB ---
// A variável DATABASE_URL é injetada pelo Render/Railway com a string de conexão do Atlas
const uri = process.env.DATABASE_URL;

if (!uri) {
    console.error("ERRO CRÍTICO: Variável DATABASE_URL não está configurada. O servidor não pode iniciar.");
    // Saia do processo para evitar falhas silenciosas
    process.exit(1); 
}

const client = new MongoClient(uri);

// Nome do banco de dados (que o MongoDB criará automaticamente se não existir)
const DB_NAME = "pesquisa_db"; 
// Nome da coleção (equivalente à 'tabela' no MongoDB)
const COLLECTION_NAME = "respostas"; 

// Variável para armazenar a conexão com o banco de dados
let db; 

// Função para Conectar ao MongoDB Atlas
async function connectToDatabase() {
    try {
        console.log("Conectando ao MongoDB Atlas...");
        // Tenta estabelecer a conexão
        await client.connect();
        
        // Atribui a referência ao banco de dados
        db = client.db(DB_NAME);
        console.log("Conexão com o MongoDB Atlas estabelecida com sucesso!");
    } catch (err) {
        console.error("ERRO FATAL ao conectar ao MongoDB:", err.message);
        console.error("Verifique a DATABASE_URL e as configurações de Network Access no Atlas (0.0.0.0/0).");
        // Em caso de falha crítica na conexão, encerra o servidor
        process.exit(1);
    }
}

// Rota POST para receber e salvar os dados do formulário
app.post('/api/respostas', async (req, res) => {
    const resposta = req.body;
    
    // Adiciona o timestamp do servidor antes de salvar
    const dataComTimestamp = {
        ...resposta,
        timestamp_cadastro: new Date()
    };
    
    console.log("Dados recebidos para inserção:", dataComTimestamp);

    if (!db) {
        // Retorna erro se a conexão não foi estabelecida
        return res.status(503).json({ error: "Serviço indisponível. Conexão com o banco de dados não estabelecida." });
    }

    try {
        // Acessa a coleção (se ela não existir, o MongoDB a cria automaticamente)
        const collection = db.collection(COLLECTION_NAME);
        
        // Insere o documento (o objeto JSON completo)
        const result = await collection.insertOne(dataComTimestamp);

        console.log(`Pesquisa salva com sucesso! ID do Documento: ${result.insertedId}`);
        // Retorna status 201 (Criado)
        res.status(201).json({ 
            message: "Pesquisa salva com sucesso no MongoDB!",
            id: result.insertedId
        });

    } catch (error) {
        console.error("Erro ao inserir dados no MongoDB:", error.message);
        // Retorna erro 500
        res.status(500).json({ error: "Erro interno do servidor ao salvar a pesquisa. Verifique os logs do Render." });
    }
});

// Rota de fallback para servir o HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicializa o servidor APÓS a conexão com o banco de dados
connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
        console.log(`A URL pública será fornecida pelo Render.`);
    });
});
