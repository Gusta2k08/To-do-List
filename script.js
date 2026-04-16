document.addEventListener('DOMContentLoaded', () => {
    // === 1. Gerenciamento de Estado ===
    let tasks = JSON.parse(localStorage.getItem('nexaTasks')) || [];
    let currentFilter = 'all';
    let editingTaskId = null; // Rastreia qual tarefa está sendo editada

    // === 2. Elementos do DOM ===
    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const taskDate = document.getElementById('taskDate');
    const prioritySelect = document.getElementById('prioritySelect');
    const taskList = document.getElementById('taskList');
    const taskCounter = document.getElementById('taskCounter');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const toastContainer = document.getElementById('toastContainer');
    
    // Elementos do Modal
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const editTaskInput = document.getElementById('editTaskInput');
    const editTaskDate = document.getElementById('editTaskDate');
    const editPrioritySelect = document.getElementById('editPrioritySelect');
    
    // Elemento de Alternância de Tema
    const themeToggle = document.getElementById('themeToggle');

    // Define a data mínima e valor padrão como hoje
    const today = new Date().toISOString().split('T')[0];
    taskDate.min = today;
    taskDate.value = today;
    editTaskDate.min = today;

    // === Tema Escuro/Claro ===
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            updateThemeIcon('dark');
        } else {
            document.body.classList.remove('dark-mode');
            updateThemeIcon('light');
        }
    }

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeToggle.innerHTML = '<i class="ph ph-sun"></i>';
            themeToggle.title = 'Alternar para modo claro';
        } else {
            themeToggle.innerHTML = '<i class="ph ph-moon"></i>';
            themeToggle.title = 'Alternar para modo escuro';
        }
    }

    function toggleTheme() {
        const isDark = document.body.classList.toggle('dark-mode');
        const theme = isDark ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        updateThemeIcon(theme);
    }

    themeToggle.addEventListener('click', toggleTheme);
    initTheme();

    // === 3. Funções Principais ==
    
    // Adicionar Tarefa
    function addTask(e) {
        e.preventDefault();
        
        const text = taskInput.value.trim();
        const priority = prioritySelect.value;
        const dueDate = taskDate.value;

        if (!text || !priority || !dueDate) {
            showToast('Preencha a tarefa, a data e a prioridade!', 'error');
            return;
        }

        const newTask = {
            id: Date.now(), // ID único
            text: text,
            priority: priority,
            dueDate: dueDate,
            completed: false
        };

        tasks.push(newTask);
        saveData();
        renderTasks();
        
        taskForm.reset();
        taskDate.value = today;
        showToast('Tarefa adicionada com sucesso!', 'success');
    }

    // Remover Tarefa
    window.deleteTask = function(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveData();
        renderTasks();
        showToast('Tarefa removida!', 'removed');
    }

    // Abrir Modal de Edição
    window.openEditModal = function(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        editingTaskId = id;
        editTaskInput.value = task.text;
        editTaskDate.value = task.dueDate;
        editPrioritySelect.value = task.priority;
        editModal.classList.remove('hidden');
        editTaskInput.focus();
    }

    // Fechar Modal de Edição
    window.closeEditModal = function() {
        editModal.classList.add('hidden');
        editingTaskId = null;
        editForm.reset();
    }

    // Salvar Alterações da Tarefa
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!editingTaskId) return;

        const newText = editTaskInput.value.trim();
        const newDate = editTaskDate.value;
        const newPriority = editPrioritySelect.value;

        if (!newText || !newDate || !newPriority) {
            showToast('Preencha todos os campos!', 'error');
            return;
        }

        tasks = tasks.map(task => {
            if (task.id === editingTaskId) {
                return { ...task, text: newText, dueDate: newDate, priority: newPriority };
            }
            return task;
        });

        saveData();
        renderTasks();
        closeEditModal();
        showToast('Tarefa atualizada com sucesso!', 'success');
    });

    // Fechar modal ao clicar fora
    editModal.addEventListener('click', function(e) {
        if (e.target === editModal) {
            closeEditModal();
        }
    });

    // Alternar Conclusão (Check/Uncheck)
    window.toggleTask = function(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                const isCompleted = !task.completed;
                if(isCompleted) showToast('Excelente! Tarefa concluída.', 'success');
                return { ...task, completed: isCompleted };
            }
            return task;
        });
        saveData();
        renderTasks();
    }

    // === 4. Renderização e Filtros ===
    
    function renderTasks() {
        taskList.innerHTML = '';

        // Aplica o filtro atual
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'pending') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return !task.completed; // 'all' - mostra apenas tarefas não concluídas
        });

        // Ordena as tarefas por data (mais próximas primeiro)
        filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        // Cria os elementos
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;
            
            // Formata a data para exibição
            const dateObj = new Date(task.dueDate + 'T00:00:00');
            const formattedDate = dateObj.toLocaleDateString('pt-BR', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            li.innerHTML = `
                <div class="task-content" onclick="toggleTask(${task.id})">
                    <div class="checkbox">
                        ${task.completed ? '<i class="ph ph-check" style="color:white;"></i>' : ''}
                    </div>
                    <div class="task-info">
                        <span class="task-text">${task.text}</span>
                        <span class="task-date"><i class="ph ph-calendar"></i> ${formattedDate}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button type="button" class="edit-btn" onclick="openEditModal(${task.id})" title="Editar Tarefa">
                        <i class="ph ph-pencil"></i>
                    </button>
                    <button type="button" class="delete-btn" onclick="deleteTask(${task.id})" title="Remover Tarefa">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            `;
            taskList.appendChild(li);
        });

        updateCounter(filteredTasks.length);
    }

    function updateCounter(count) {
        taskCounter.textContent = count;
    }

    // Escutadores de Filtro
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove a classe active de todos e adiciona no clicado
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            currentFilter = e.target.dataset.filter;
            renderTasks();
        });
    });

    // === 5. Utilitários ===

    // Salvar no LocalStorage
    function saveData() {
        localStorage.setItem('nexaTasks', JSON.stringify(tasks));
    }

    // Sistema de Feedback Visual (Toasts)
    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        // Estilização condicional do Toast
        if(type === 'error') toast.style.borderLeftColor = 'var(--nexa-orange)';
        if(type === 'removed') toast.style.borderLeftColor = 'var(--nexa-silver)';

        toast.innerHTML = `<strong>Nexa Info:</strong> ${message}`;
        toastContainer.appendChild(toast);

        // Remove o toast após 3 segundos
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // === 6. Inicialização ===
    taskForm.addEventListener('submit', addTask);
    renderTasks();
});