document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('lifestyleForm');
    const messageElement = document.getElementById('message');
    const frequencyInput = document.getElementById('frequency');
    const durationInput = document.getElementById('duration');
    
    // Seleciona todos os inputs de rádio para controle condicional
    const exerciseRadios = document.querySelectorAll('input[name="practiceExercise"]');
    
    // --- VARIÁVEL DE CONFIGURAÇÃO IMPORTANTE ---
    // Rota que deve corresponder à rota POST no seu server.js
    const API_ENDPOINT = '/api/respostas'; 

    // Função para mostrar a mensagem de feedback
    function showMessage(text, type) {
        messageElement.classList.remove('hidden', 'success', 'error'); 
        messageElement.textContent = text;
        messageElement.className = type; 
    }

    // Lógica para controle condicional (Frequência e Duração do Exercício)
    function toggleExerciseInputs() {
        const selectedValue = document.querySelector('input[name="practiceExercise"]:checked');
        const isDisabled = selectedValue && selectedValue.value === 'Não';
        
        // Desativa/Ativa Frequência e Duração
        frequencyInput.disabled = isDisabled;
        durationInput.disabled = isDisabled;

        if (isDisabled) {
            // Se "Não" for selecionado, zera os campos para enviar '0' ao banco de dados
            frequencyInput.value = 0;
            durationInput.value = 0;
        } else {
            // Se "Sim" for selecionado, garante que os campos estejam vazios ou com valor real
            if (frequencyInput.value === '0') frequencyInput.value = '';
            if (durationInput.value === '0') durationInput.value = '';
        }
    }

    // Inicializa o controle condicional e adiciona listeners de mudança
    toggleExerciseInputs();
    exerciseRadios.forEach(radio => {
        radio.addEventListener('change', toggleExerciseInputs);
    });

    // Listener para o envio do formulário
    form.addEventListener('submit', async function(event) {
        event.preventDefault(); // Impede o envio padrão

        // 1. Coleta e serializa os dados do formulário
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // 2. Ajuste condicional final antes de enviar
        if (data.practiceExercise === 'Não') {
            data.frequency = 0;
            data.duration = 0; 
        }

        // 3. Validação Adicional (Exemplo: Idade mínima)
        if (parseInt(data.age) < 15) {
            showMessage("Erro: A idade mínima para participar é 15 anos.", "error");
            return;
        }
        
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

            const responseData = await response.json(); 

            if (response.ok) {
                // Sucesso
                showMessage("Pesquisa enviada com sucesso! Obrigado.", "success");
                
                // Limpa o formulário após o sucesso
                setTimeout(() => {
                    form.reset();
                    messageElement.classList.add('hidden');
                    toggleExerciseInputs(); // Reseta o estado condicional
                }, 3000);

            } else {
                // Erro do Servidor
                showMessage(`Erro no envio: ${responseData.error || 'Falha ao processar os dados.'}`, "error");
            }

        } catch (error) {
            // Erro de Conexão
            console.error("Erro ao enviar dados:", error);
            showMessage("Erro de conexão! Não foi possível enviar a pesquisa ao servidor.", "error");
        }
    });
});