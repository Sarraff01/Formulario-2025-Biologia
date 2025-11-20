const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
// O Railway define automaticamente a porta no ambiente de produção
const PORT = process.env.PORT || 3000;

// --- 1. CONFIGURAÇÃO DA CONEXÃO COM O POSTGRESQL (RAILWAY) ---
const pool = new Pool({
  // O Railway injeta a URL de conexão (DATABASE_URL) automaticamente
  connectionString: process.env.DATABASE_URL, 
  // Configurações SSL são cruciais para conexões em serviços cloud como o Railway
  ssl: {
    // Permite conexões de certificado auto-assinado (comum em Railway)
    rejectUnauthorized: false 
  }
});

// Testa a conexão ao iniciar
pool.connect()
  .then(() => console.log('✅ Conexão com PostgreSQL estabelecida com sucesso!'))
  .catch(err => console.error('❌ Erro de conexão com o Banco de Dados:', err));


// --- 2. MIDDLEWARES E SERVIÇO DE ARQUIVOS ESTÁTICOS ---

// Permite que o servidor leia dados JSON enviados pelo frontend
app.use(express.json()); 

// Serve os arquivos estáticos (HTML, CSS, JS) dentro da pasta 'public'
// Garante que o frontend seja carregado corretamente
app.use(express.static(path.join(__dirname, 'public')));


// --- 3. ROTA DE API PARA SALVAR DADOS ---

// A rota deve corresponder exatamente ao API_ENDPOINT definido no seu script.js ('/api/respostas')
app.post('/api/respostas', async (req, res) => {
  const data = req.body;
  console.log('Dados recebidos:', data);

  // Mapeia os dados do formulário para variáveis de forma organizada
  const {
    name, age, health, chronicCondition,
    practiceExercise, frequency, duration, exerciseType, sedentaryTime, exerciseBarrier, activeTransport,
    fruitVeggie, processedFood, eatOutFrequency, water, breakfast, balancedDiet,
    sleepHours, sleepQuality, sleepDifficulty, stressLevel, leisureTime, smoke, alcoholFrequency, checkupFrequency, socialSupport, weightSatisfaction, screenTime
  } = data;
  
  // Converte string para número onde for necessário (para evitar erros de BD)
  const age_int = parseInt(age);
  const frequency_int = parseInt(frequency);
  const duration_int = parseInt(duration);
  const eatOutFrequency_int = parseInt(eatOutFrequency);
  const water_int = parseInt(water);
  const sleepHours_int = parseInt(sleepHours);
  const sleepQuality_int = parseInt(sleepQuality);
  const stressLevel_int = parseInt(stressLevel);
  const socialSupport_int = parseInt(socialSupport);
  const weightSatisfaction_int = parseInt(weightSatisfaction);


  // A Query SQL: Insere os dados na tabela 'respostas'.
  // NOTA: Os nomes das colunas aqui (ex: 'chronic_condition') devem 
  //       corresponder EXATAMENTE aos nomes que você usou no comando CREATE TABLE.
  const queryText = `
    INSERT INTO respostas (
      name, age, health, chronic_condition, 
      practice_exercise, frequency, duration, exercise_type, sedentary_time, exercise_barrier, active_transport, 
      fruit_veggie, processed_food, eat_out_frequency, water, breakfast, balanced_diet, 
      sleep_hours, sleep_quality, sleep_difficulty, stress_level, leisure_time, smoke, alcohol_frequency, checkup_frequency, social_support, weight_satisfaction, screen_time
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
    ) RETURNING id;
  `;

  // Array de valores para a Query SQL (precisam estar na mesma ordem dos $1, $2, etc.)
  const values = [
    name || null, age_int, health, chronicCondition,
    practiceExercise, frequency_int, duration_int, exerciseType, sedentaryTime, exerciseBarrier, activeTransport,
    fruitVeggie, processedFood, eatOutFrequency_int, water_int, breakfast, balancedDiet,
    sleepHours_int, sleepQuality_int, sleepDifficulty, stressLevel_int, leisureTime, smoke, alcoholFrequency, checkupFrequency, socialSupport_int, weightSatisfaction_int, screenTime
  ];
  
  try {
    // Executa a query no banco de dados
    const result = await pool.query(queryText, values);
    
    // Resposta de sucesso para o frontend
    res.status(201).json({ 
      message: 'Pesquisa salva com sucesso!', 
      id: result.rows[0].id 
    });

  } catch (error) {
    console.error('❌ Erro ao salvar dados no PostgreSQL:', error);
    // Resposta de erro para o frontend
    res.status(500).json({ 
      error: 'Falha ao salvar a pesquisa. Verifique a estrutura da tabela e os tipos de dados.',
      details: error.message // Útil para depuração (debugging)
    });
  }
});


// --- 4. INICIA O SERVIDOR ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT} (ou porta Railway)`);
});