// app.js

document.addEventListener('DOMContentLoaded', () => {
    // Selectors
    const board = document.getElementById('board');
    const btnAddCategory = document.getElementById('btn-add-category');
    const btnImportCsv = document.getElementById('btn-import-csv');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnViewDeleted = document.getElementById('btn-view-deleted');
    const fileUpload = document.getElementById('file-upload');

    const modalImport = document.getElementById('modal-import');
    const btnImportMerge = document.getElementById('btn-import-merge');
    const btnImportOverwrite = document.getElementById('btn-import-overwrite');
    const btnImportCancel = document.getElementById('btn-import-cancel');

    const modalDeleted = document.getElementById('modal-deleted');
    const btnCloseDeleted = document.getElementById('btn-close-deleted');
    const deletedItemsContainer = document.getElementById('deleted-items-container');

    // Templates
    const tplCategory = document.getElementById('tpl-category').content;
    const tplTask = document.getElementById('tpl-task').content;

    // State Management
    let data = [];
    let sortableCategories = null;
    let sortableTasksInstances = [];
    let importFileData = null;

    // Initialize
    loadData();
    renderBoard();

    // UUID Generator
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // LocalStorage
    function saveData() {
        localStorage.setItem('taskManagerData', JSON.stringify(data));
    }

    function loadData() {
        const stored = localStorage.getItem('taskManagerData');
        if (stored) {
            try {
                data = JSON.parse(stored);
            } catch (e) {
                console.error("Error parsing localStorage data", e);
                data = [];
            }
        } else {
            data = [];
        }
    }

    // Data Operations
    function getCategories() {
        return data.filter(i => i.Type === 'category' && !i.Deleted).sort((a, b) => a.Order - b.Order);
    }

    function getTasks(parentId) {
        return data.filter(i => i.Type === 'task' && i.ParentId === parentId && !i.Deleted).sort((a, b) => a.Order - b.Order);
    }

    function getDeletedItems() {
        return data.filter(i => i.Deleted);
    }

    function addCategory(name = "Nueva Categoría") {
        const categories = getCategories();
        const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.Order)) : -1;
        const newCat = {
            Id: generateUUID(),
            Type: 'category',
            ParentId: '',
            Name: name,
            Order: maxOrder + 1,
            Completed: false,
            Counter: 0,
            Percentage: 0,
            Note: '',
            Deleted: false
        };
        data.push(newCat);
        saveData();
        renderBoard();
    }

    function addTask(parentId, name = "Nueva Tarea") {
        const tasks = getTasks(parentId);
        const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.Order)) : -1;
        const newTask = {
            Id: generateUUID(),
            Type: 'task',
            ParentId: parentId,
            Name: name,
            Order: maxOrder + 1,
            Completed: false,
            Counter: 0,
            Percentage: 0,
            Note: '',
            Deleted: false
        };
        data.push(newTask);
        saveData();
        renderBoard();
    }

    function updateItem(id, updates) {
        const idx = data.findIndex(i => i.Id === id);
        if (idx !== -1) {
            data[idx] = { ...data[idx], ...updates };
            saveData();
        }
    }

    function virtualDeleteItem(id) {
        const idx = data.findIndex(i => i.Id === id);
        if (idx !== -1) {
            const item = data[idx];
            if (item.Type === 'category') {
                if (confirm(`¿Estás seguro de que quieres borrar la categoría "${item.Name}"? (Podrás restaurarla desde la vista de borrados)`)) {
                    data[idx].Deleted = true;
                    // Also delete all tasks inside it
                    data.forEach(t => {
                        if (t.Type === 'task' && t.ParentId === id) {
                            t.Deleted = true;
                        }
                    });
                    saveData();
                    renderBoard();
                }
            } else {
                data[idx].Deleted = true;
                saveData();
                renderBoard();
            }
        }
    }

    function restoreItem(id) {
        const idx = data.findIndex(i => i.Id === id);
        if (idx !== -1) {
            const item = data[idx];
            data[idx].Deleted = false;

            // If restoring a task, check if its category is still deleted. If so, restore it too.
            if (item.Type === 'task') {
                const parentIdx = data.findIndex(c => c.Id === item.ParentId);
                if (parentIdx !== -1 && data[parentIdx].Deleted) {
                    data[parentIdx].Deleted = false;
                }
            }
            saveData();
            renderDeleted();
            renderBoard();
        }
    }

    // UI Rendering
    function renderBoard() {
        // Destroy old sortables
        if (sortableCategories) sortableCategories.destroy();
        sortableTasksInstances.forEach(s => s.destroy());
        sortableTasksInstances = [];

        board.innerHTML = '';
        const categories = getCategories();

        categories.forEach(cat => {
            const catNode = document.importNode(tplCategory, true);
            const catEl = catNode.querySelector('.category-column');
            catEl.dataset.id = cat.Id;

            const nameInput = catEl.querySelector('.category-name');
            nameInput.value = cat.Name;

            // Name update
            nameInput.addEventListener('change', (e) => {
                updateItem(cat.Id, { Name: e.target.value });
            });

            // Delete category
            catEl.querySelector('.btn-delete-category').addEventListener('click', () => {
                virtualDeleteItem(cat.Id);
            });

            // Add task
            catEl.querySelector('.btn-add-task').addEventListener('click', () => {
                addTask(cat.Id);
            });

            // Render tasks
            const taskList = catEl.querySelector('.task-list');
            taskList.dataset.categoryId = cat.Id;
            const tasks = getTasks(cat.Id);

            tasks.forEach(task => {
                const taskNode = createDOMTask(task);
                taskList.appendChild(taskNode);
            });

            board.appendChild(catNode);
        });

        // Init Sortable Categories
        sortableCategories = new Sortable(board, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            handle: '.category-header',
            onEnd: (evt) => {
                const itemEls = board.querySelectorAll('.category-column');
                itemEls.forEach((el, index) => {
                    const id = el.dataset.id;
                    updateItem(id, { Order: index });
                });
            }
        });

        // Init Sortable Tasks
        const taskLists = board.querySelectorAll('.task-list');
        taskLists.forEach(list => {
            sortableTasksInstances.push(new Sortable(list, {
                group: 'shared',
                animation: 150,
                ghostClass: 'sortable-ghost',
                handle: '.task-item',
                onEnd: (evt) => {
                    const toList = evt.to;
                    const fromList = evt.from;
                    const newParentId = toList.dataset.categoryId;

                    // Update order and parentId for all items in the target list
                    const taskEls = toList.querySelectorAll('.task-item');
                    taskEls.forEach((el, index) => {
                        const id = el.dataset.id;
                        updateItem(id, { Order: index, ParentId: newParentId });
                    });

                    // If moved to a different list, also update order of the original list just in case
                    if (toList !== fromList) {
                        const fromTaskEls = fromList.querySelectorAll('.task-item');
                        fromTaskEls.forEach((el, index) => {
                            const id = el.dataset.id;
                            updateItem(id, { Order: index });
                        });
                    }
                }
            }));
        });
    }

    function createDOMTask(task) {
        const taskNode = document.importNode(tplTask, true);
        const taskEl = taskNode.querySelector('.task-item');
        taskEl.dataset.id = task.Id;

        // Elements
        const cb = taskEl.querySelector('.task-checkbox');
        const nameInput = taskEl.querySelector('.task-name');
        const counterVal = taskEl.querySelector('.counter-val');
        const percentVal = taskEl.querySelector('.percentage-val');
        const noteBadge = taskEl.querySelector('.badge-note');
        const btnExpand = taskEl.querySelector('.btn-expand-task');
        const btnDelete = taskEl.querySelector('.btn-delete-task');
        const expandedArea = taskEl.querySelector('.task-expanded');

        // Expanded elements
        const btnCountDec = taskEl.querySelector('.btn-counter-dec');
        const btnCountInc = taskEl.querySelector('.btn-counter-inc');
        const inputCount = taskEl.querySelector('.input-counter');
        const inputPercent = taskEl.querySelector('.input-percentage');
        const labelPercent = taskEl.querySelector('.label-percentage');
        const inputNote = taskEl.querySelector('.input-note');

        // Set initial values
        cb.checked = task.Completed;
        nameInput.value = task.Name;
        if (task.Completed) {
            nameInput.classList.add('line-through', 'text-gray-400');
        }

        counterVal.textContent = task.Counter;
        inputCount.value = task.Counter;

        percentVal.textContent = task.Percentage;
        inputPercent.value = task.Percentage;
        labelPercent.textContent = task.Percentage;

        inputNote.value = task.Note;
        if (task.Note && task.Note.trim() !== '') {
            noteBadge.classList.remove('hidden');
        }

        // Events
        cb.addEventListener('change', (e) => {
            const completed = e.target.checked;
            updateItem(task.Id, { Completed: completed });
            if (completed) {
                nameInput.classList.add('line-through', 'text-gray-400');
            } else {
                nameInput.classList.remove('line-through', 'text-gray-400');
            }
        });

        nameInput.addEventListener('change', (e) => {
            updateItem(task.Id, { Name: e.target.value });
        });

        btnDelete.addEventListener('click', () => {
            virtualDeleteItem(task.Id);
        });

        // Expand/Collapse
        btnExpand.addEventListener('click', () => {
            expandedArea.classList.toggle('hidden');
            const icon = btnExpand.querySelector('i');
            if (expandedArea.classList.contains('hidden')) {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            } else {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
        });

        // Counter
        const updateCounter = (val) => {
            const newVal = Math.max(0, val);
            inputCount.value = newVal;
            counterVal.textContent = newVal;
            updateItem(task.Id, { Counter: newVal });
        };
        btnCountDec.addEventListener('click', () => updateCounter(parseInt(inputCount.value) - 1));
        btnCountInc.addEventListener('click', () => updateCounter(parseInt(inputCount.value) + 1));
        inputCount.addEventListener('change', (e) => updateCounter(parseInt(e.target.value) || 0));

        // Percentage
        inputPercent.addEventListener('input', (e) => {
            const val = e.target.value;
            labelPercent.textContent = val;
            percentVal.textContent = val;
            updateItem(task.Id, { Percentage: parseInt(val) });
        });

        // Note
        inputNote.addEventListener('change', (e) => {
            const val = e.target.value;
            updateItem(task.Id, { Note: val });
            if (val.trim() !== '') {
                noteBadge.classList.remove('hidden');
            } else {
                noteBadge.classList.add('hidden');
            }
        });

        return taskEl;
    }

    // Deleted Items View
    function renderDeleted() {
        deletedItemsContainer.innerHTML = '';
        const deletedItems = getDeletedItems();

        if (deletedItems.length === 0) {
            deletedItemsContainer.innerHTML = '<p class="text-gray-500 text-center py-8">No hay elementos borrados.</p>';
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'divide-y divide-gray-200';

        deletedItems.forEach(item => {
            const li = document.createElement('li');
            li.className = 'py-3 flex justify-between items-center';

            const icon = item.Type === 'category' ? '<i class="fas fa-folder text-indigo-400 mr-2"></i>' : '<i class="fas fa-check-square text-emerald-400 mr-2"></i>';
            const typeLabel = item.Type === 'category' ? 'Categoría' : 'Tarea';

            // Safe HTML escaping for user input
            const escapeHtml = (unsafe) => {
                return unsafe
                     .replace(/&/g, "&amp;")
                     .replace(/</g, "&lt;")
                     .replace(/>/g, "&gt;")
                     .replace(/"/g, "&quot;")
                     .replace(/'/g, "&#039;");
            };

            li.innerHTML = `
                <div class="flex items-center">
                    ${icon}
                    <div>
                        <p class="text-sm font-medium text-gray-800">${escapeHtml(item.Name)}</p>
                        <p class="text-xs text-gray-500">${typeLabel}</p>
                    </div>
                </div>
                <button class="btn-restore bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1 rounded text-sm transition font-medium">
                    Restaurar
                </button>
            `;

            li.querySelector('.btn-restore').addEventListener('click', () => {
                restoreItem(item.Id);
            });

            ul.appendChild(li);
        });

        deletedItemsContainer.appendChild(ul);
    }

    // Export CSV
    function exportToCsv() {
        const csvData = data.map(i => ({
            Id: i.Id,
            Type: i.Type,
            ParentId: i.ParentId,
            Name: i.Name,
            Order: i.Order,
            Completed: i.Completed,
            Counter: i.Counter,
            Percentage: i.Percentage,
            Note: i.Note,
            Deleted: i.Deleted
        }));

        const csvString = Papa.unparse(csvData);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "tareas.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Import CSV Actions
    function handleFileSelect(evt) {
        const file = evt.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
                importFileData = results.data;
                // Show modal to ask user what to do
                modalImport.classList.remove('hidden');
                // Reset file input so same file can be selected again if needed
                fileUpload.value = '';
            },
            error: function(err) {
                alert("Error al parsear el archivo CSV: " + err.message);
                fileUpload.value = '';
            }
        });
    }

    function applyImport(mode) {
        if (!importFileData) return;

        // Clean up parsed data types
        const parsedData = importFileData.map(row => ({
            Id: String(row.Id || generateUUID()),
            Type: String(row.Type || 'task'),
            ParentId: row.ParentId ? String(row.ParentId) : '',
            Name: String(row.Name || ''),
            Order: parseInt(row.Order) || 0,
            Completed: String(row.Completed).toLowerCase() === 'true',
            Counter: parseInt(row.Counter) || 0,
            Percentage: parseInt(row.Percentage) || 0,
            Note: row.Note || '',
            Deleted: String(row.Deleted).toLowerCase() === 'true'
        }));

        if (mode === 'overwrite') {
            data = parsedData;
        } else if (mode === 'merge') {
            // Unify. A simple approach: add all.
            // In a more complex scenario we would match IDs. We will merge by pushing everything.
            // If they share exactly the same ID from a previous export, we overwrite that specific item.
            parsedData.forEach(newItem => {
                const existingIdx = data.findIndex(i => i.Id === newItem.Id);
                if (existingIdx !== -1) {
                    data[existingIdx] = newItem;
                } else {
                    data.push(newItem);
                }
            });
        }

        saveData();
        renderBoard();
        modalImport.classList.add('hidden');
        importFileData = null;
    }

    // Event Listeners for UI
    btnAddCategory.addEventListener('click', () => addCategory());

    btnExportCsv.addEventListener('click', exportToCsv);

    btnImportCsv.addEventListener('click', () => fileUpload.click());
    fileUpload.addEventListener('change', handleFileSelect);

    btnImportMerge.addEventListener('click', () => applyImport('merge'));
    btnImportOverwrite.addEventListener('click', () => applyImport('overwrite'));
    btnImportCancel.addEventListener('click', () => {
        modalImport.classList.add('hidden');
        importFileData = null;
    });

    btnViewDeleted.addEventListener('click', () => {
        renderDeleted();
        modalDeleted.classList.remove('hidden');
    });

    btnCloseDeleted.addEventListener('click', () => {
        modalDeleted.classList.add('hidden');
    });
});
