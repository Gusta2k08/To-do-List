document.addEventListener('DOMContentLoaded', () => {
    // === 1. Gerenciamento de Estado ===
    let tasks = JSON.parse(localStorage.getItem('nexaTasks')) || [];
    let currentFilter = 'all';
    let currentSearch = '';
    let currentSort = 'dateAsc';
    let editingTaskId = null;

    // === 2. Elementos do DOM ===
    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const taskDate = document.getElementById('taskDate');
    const prioritySelect = document.getElementById('prioritySelect');
    const categorySelect = document.getElementById('categorySelect');
    const subtaskInput = document.getElementById('subtaskInput');
    const taskList = document.getElementById('taskList');
    const taskCounter = document.getElementById('taskCounter');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importInput = document.getElementById('importInput');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressStatus = document.getElementById('progressStatus');
    const accentSelect = document.getElementById('accentSelect');
    const toastContainer = document.getElementById('toastContainer');

    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const editTaskInput = document.getElementById('editTaskInput');
    const editTaskDate = document.getElementById('editTaskDate');
    const editPrioritySelect = document.getElementById('editPrioritySelect');
    const editCategorySelect = document.getElementById('editCategorySelect');
    const editSubtaskInput = document.getElementById('editSubtaskInput');
    const modalCloseButtons = editModal.querySelectorAll('.modal-close, .btn-cancel');

    const themeToggle = document.getElementById('themeToggle');

    const today = new Date().toISOString().split('T')[0];
    taskDate.min = today;
    taskDate.value = today;
    editTaskDate.min = today;

    const accentMap = {
        purple: { color: '#a78bfa', light: '#ede9fe' },
        orange: { color: '#ea580c', light: '#ffedd5' },
        green: { color: '#22c55e', light: '#dcfce7' }
    };

    function applyAccentTheme(value) {
        const accent = accentMap[value] || accentMap.purple;
        document.documentElement.style.setProperty('--accent-color', accent.color);
        document.documentElement.style.setProperty('--accent-color-light', accent.light);
        localStorage.setItem('accentTheme', value);
        accentSelect.value = value;
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedAccent = localStorage.getItem('accentTheme') || 'purple';

        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="ph ph-sun"></i>';
            themeToggle.title = 'Alternar para modo claro';
        } else {
            document.body.classList.remove('dark-mode');
            themeToggle.innerHTML = '<i class="ph ph-moon"></i>';
            themeToggle.title = 'Alternar para modo escuro';
        }

        applyAccentTheme(savedAccent);
    }

    function toggleTheme() {
        const isDark = document.body.classList.toggle('dark-mode');
        const theme = isDark ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        themeToggle.innerHTML = isDark ? '<i class="ph ph-sun"></i>' : '<i class="ph ph-moon"></i>';
        themeToggle.title = isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro';
    }

    themeToggle.addEventListener('click', toggleTheme);
    accentSelect.addEventListener('change', () => applyAccentTheme(accentSelect.value));
    initTheme();

    function parseSubtasks(value) {
        return value
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
    }

    function addTask(e) {
        e.preventDefault();

        const text = taskInput.value.trim();
        const priority = prioritySelect.value;
        const dueDate = taskDate.value;
        const category = categorySelect.value;
        const subtasks = parseSubtasks(subtaskInput.value);

        if (!text || !priority || !dueDate || !category) {
            showToast('Preencha a tarefa, a data, a prioridade e a categoria!', 'error');
            return;
        }

        const newTask = {
            id: Date.now(),
            text,
            priority,
            dueDate,
            category,
            subtasks,
            completed: false,
            createdAt: Date.now()
        };

        tasks.push(newTask);
        saveData();
        renderTasks();

        taskForm.reset();
        taskDate.value = today;
        showToast('Tarefa adicionada com sucesso!', 'success');
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveData();
        renderTasks();
        showToast('Tarefa removida!', 'removed');
    }

    function openEditModal(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        editingTaskId = id;
        editTaskInput.value = task.text;
        editTaskDate.value = task.dueDate;
        editPrioritySelect.value = task.priority;
        editCategorySelect.value = task.category || 'Outro';
        editSubtaskInput.value = task.subtasks ? task.subtasks.join(', ') : '';
        editModal.classList.remove('hidden');
        editTaskInput.focus();
    }

    function closeEditModal() {
        editModal.classList.add('hidden');
        editingTaskId = null;
        editForm.reset();
    }

    modalCloseButtons.forEach(button => button.addEventListener('click', closeEditModal));

    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!editingTaskId) return;

        const newText = editTaskInput.value.trim();
        const newDate = editTaskDate.value;
        const newPriority = editPrioritySelect.value;
        const newCategory = editCategorySelect.value;
        const newSubtasks = parseSubtasks(editSubtaskInput.value);

        if (!newText || !newDate || !newPriority || !newCategory) {
            showToast('Preencha todos os campos!', 'error');
            return;
        }

        tasks = tasks.map(task => {
            if (task.id === editingTaskId) {
                return {
                    ...task,
                    text: newText,
                    dueDate: newDate,
                    priority: newPriority,
                    category: newCategory,
                    subtasks: newSubtasks
                };
            }
            return task;
        });

        saveData();
        renderTasks();
        closeEditModal();
        showToast('Tarefa atualizada com sucesso!', 'success');
    });

    editModal.addEventListener('click', function(e) {
        if (e.target === editModal) closeEditModal();
    });

    function toggleTask(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                const isCompleted = !task.completed;
                if (isCompleted) showToast('Excelente! Tarefa concluída.', 'success');
                return { ...task, completed: isCompleted };
            }
            return task;
        });
        saveData();
        renderTasks();
    }

    function clearCompletedTasks() {
        tasks = tasks.filter(task => !task.completed);
        saveData();
        renderTasks();
        showToast('Tarefas concluídas removidas.', 'success');
    }

    clearCompletedBtn.addEventListener('click', clearCompletedTasks);

    exportBtn.addEventListener('click', function() {
        const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'nexa-tarefas.json';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showToast('Exportação concluída.', 'success');
    });

    importBtn.addEventListener('click', function() {
        importInput.click();
    });

    importInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (!Array.isArray(importedTasks)) throw new Error('Formato inválido');

                tasks = importedTasks.map(task => ({
                    id: task.id || Date.now(),
                    text: task.text || '',
                    priority: task.priority || 'baixa',
                    dueDate: task.dueDate || today,
                    category: task.category || 'Outro',
                    subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
                    completed: !!task.completed,
                    createdAt: task.createdAt || Date.now()
                }));
                saveData();
                renderTasks();
                showToast('Importação concluída.', 'success');
            } catch {
                showToast('Arquivo inválido. Use um JSON de tarefas.', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    });

    searchInput.addEventListener('input', function(e) {
        currentSearch = e.target.value.trim().toLowerCase();
        renderTasks();
    });

    sortSelect.addEventListener('change', function(e) {
        currentSort = e.target.value;
        renderTasks();
    });

    function renderTasks() {
        taskList.innerHTML = '';
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const filteredTasks = tasks
            .filter(task => {
                if (currentFilter === 'pending') return !task.completed;
                if (currentFilter === 'completed') return task.completed;
                return true;
            })
            .filter(task => {
                const dateText = new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR');
                const searchTerms = [task.text, task.category, dateText].join(' ').toLowerCase();
                return searchTerms.includes(currentSearch);
            });

        filteredTasks.sort((a, b) => {
            if (currentSort === 'dateAsc') return new Date(a.dueDate) - new Date(b.dueDate);
            if (currentSort === 'dateDesc') return new Date(b.dueDate) - new Date(a.dueDate);
            if (currentSort === 'priorityHigh') {
                const order = { alta: 1, media: 2, baixa: 3 };
                return order[a.priority] - order[b.priority];
            }
            if (currentSort === 'priorityLow') {
                const order = { baixa: 1, media: 2, alta: 3 };
                return order[a.priority] - order[b.priority];
            }
            if (currentSort === 'createdNewest') return b.createdAt - a.createdAt;
            return 0;
        });

        filteredTasks.forEach(task => {
            const dateObj = new Date(task.dueDate + 'T00:00:00');
            const formattedDate = dateObj.toLocaleDateString('pt-BR', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const diffDays = Math.ceil((dateObj - now) / (1000 * 60 * 60 * 24));
            const isOverdue = !task.completed && diffDays < 0;
            const isSoon = !task.completed && diffDays >= 0 && diffDays <= 2;
            const dueTag = isOverdue
                ? '<span class="due-tag overdue">Atrasado</span>'
                : isSoon
                ? '<span class="due-tag soon">Prazo próximo</span>'
                : '';
            const subtasksHtml = task.subtasks && task.subtasks.length
                ? `<ul class="subtask-list">${task.subtasks.map(sub => `<li>${sub}</li>`).join('')}</ul>`
                : '';

            const li = document.createElement('li');
            li.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} ${isSoon ? 'due-soon' : ''}`;

            const taskContent = document.createElement('div');
            taskContent.className = 'task-content';
            taskContent.addEventListener('click', () => toggleTask(task.id));

            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox';
            if (task.completed) {
                checkbox.innerHTML = '<i class="ph ph-check" style="color:white"></i>';
            }

            const taskDetailGroup = document.createElement('div');
            taskDetailGroup.className = 'task-detail-group';

            const taskInfo = document.createElement('div');
            taskInfo.className = 'task-info';

            const taskText = document.createElement('span');
            taskText.className = 'task-text';
            taskText.textContent = task.text;

            const taskMeta = document.createElement('div');
            taskMeta.className = 'task-meta';
            taskMeta.innerHTML = `
                <span class="category-badge">${task.category}</span>
                <span class="task-date"><i class="ph ph-calendar"></i> ${formattedDate}</span>
                ${dueTag}
            `;

            taskInfo.appendChild(taskText);
            taskInfo.appendChild(taskMeta);
            taskDetailGroup.appendChild(taskInfo);

            if (subtasksHtml) {
                const subtasksContainer = document.createElement('div');
                subtasksContainer.innerHTML = subtasksHtml;
                taskDetailGroup.appendChild(subtasksContainer);
            }

            taskContent.appendChild(checkbox);
            taskContent.appendChild(taskDetailGroup);

            const taskActions = document.createElement('div');
            taskActions.className = 'task-actions';

            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'edit-btn';
            editBtn.title = 'Editar Tarefa';
            editBtn.innerHTML = '<i class="ph ph-pencil"></i>';
            editBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                openEditModal(task.id);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'delete-btn';
            deleteBtn.title = 'Remover Tarefa';
            deleteBtn.innerHTML = '<i class="ph ph-trash"></i>';
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                deleteTask(task.id);
            });

            taskActions.appendChild(editBtn);
            taskActions.appendChild(deleteBtn);
            li.appendChild(taskContent);
            li.appendChild(taskActions);
            taskList.appendChild(li);
        });

        updateCounter(filteredTasks.length);
        renderProgress();
    }

    function updateCounter(count) {
        taskCounter.textContent = count;
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderTasks();
        });
    });

    function renderProgress() {
        const total = tasks.length;
        const completedCount = tasks.filter(task => task.completed).length;
        const percent = total ? Math.round((completedCount / total) * 100) : 0;
        progressBar.value = percent;
        progressText.textContent = `${completedCount} de ${total} tarefas concluídas`;
        progressStatus.textContent = total === 0 ? 'Sem tarefas no momento' : `${percent}% completo`;
    }

    function saveData() {
        localStorage.setItem('nexaTasks', JSON.stringify(tasks));
    }

    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        if (type === 'error') toast.style.borderLeftColor = 'var(--nexa-orange)';
        if (type === 'removed') toast.style.borderLeftColor = 'var(--nexa-silver)';
        toast.innerHTML = `<strong>Nexa Info:</strong> ${message}`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    taskForm.addEventListener('submit', addTask);
    renderTasks();
});