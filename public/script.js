document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('lifestyleForm');
    const messageElement = document.getElementById('message');
    const frequencyInput = document.getElementById('frequency');
    
    // Seleciona todos os inputs de rádio para controle condicional
    const exerciseRadios = document.querySelectorAll('input[name="practiceExercise"]');
    
    // --- VARIÁVEL DE CONFIGURAÇÃO IMPORTANTE ---
    // Esta é a rota que você definiu no seu server.js para receber os dados.
    const API_ENDPOINT = '/api/respostas'; 

    // Função para mostrar a mensagem de feedback
    function showMessage(text, type) {
        // Oculta rapidamente e define o novo conteúdo/classe
        messageElement.classList.add('hidden'); 
        messageElement.textContent = text;
        messageElement.className = type; // Define a classe (success ou error)
        
        // Exibe após um pequeno atraso
        setTimeout(() => {
            messageElement.classList.remove('hidden');
        }, 10);
    }

    // Lógica para controle condicional do campo de frequência
    function toggleFrequencyInput() {
        const selectedValue = document.querySelector('input[name="practiceExercise"]:checked');
        
        if (selectedValue && selectedValue.value === 'Não') {
            frequencyInput.value = 0;
            frequencyInput.disabled = true;
        } else {
            // Se "Sim" for selecionado, ou se nenhum estiver selecionado ao carregar
            frequencyInput.disabled = false;
            // Limpa o valor se estava 0 por desativação
            if (frequencyInput.value === '0') {
                frequencyInput.value = ''; 
            }
        }
    }

    // Inicializa o controle condicional e adiciona listeners de mudança
    toggleFrequencyInput();
    exerciseRadios.forEach(radio => {
        radio.addEventListener('change', toggleFrequencyInput);
    });

    // Listener para o envio do formulário
    form.addEventListener('submit', async function(event) {
        event.preventDefault(); // Impede o envio padrão do formulário

        // 1. Coleta e serializa os dados do formulário
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Corrige o valor da frequência se desabilitado (garante que 0 é enviado se "Não")
        if (data.practiceExercise === 'Não') {
            data.frequency = 0;
            // Define a duração como 0 se não pratica
            data.duration = 0; 
        }

        // 2. Validação Adicional (Exemplo: Idade mínima)
        if (parseInt(data.age) < 15) {
            showMessage("Erro: A idade mínima para participar é 15 anos.", "error");
            return;
        }
        
        // 3. Preparação dos dados para envio (JSON)
        const jsonData = JSON.stringify(data);
        console.log("Dados prontos para envio:", jsonData);

        // 4. ENVIO DE DADOS PARA O SERVIDOR (BACKEND)
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: jsonData
            });

            // Analisa a resposta JSON do servidor
            const responseData = await response.json(); 

            if (response.ok) {
                // Se o servidor retornar 2xx (Sucesso)
                showMessage("Pesquisa enviada com sucesso! Obrigado, " + (data.name || 'participante') + ".", "success");
                
                // Limpa o formulário após o sucesso
                setTimeout(() => {
                    form.reset();
                    messageElement.classList.add('hidden');
                    toggleFrequencyInput(); // Reseta o estado condicional
                }, 3000);

            } else {
                // Se o servidor retornar 4xx ou 5xx (Erro)
                showMessage(`Erro no envio: ${responseData.error || 'Falha ao processar os dados.'}`, "error");
            }

        } catch (error) {
            // Erro de rede (servidor inacessível, URL errada, etc.)
            console.error("Erro ao enviar dados:", error);
            showMessage("Erro de conexão! Não foi possível enviar a pesquisa ao servidor. Verifique o servidor.", "error");
        }
    });
});
