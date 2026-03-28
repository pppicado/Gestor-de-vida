// app.js

document.addEventListener('DOMContentLoaded', () => {
    // Selectors
    const board = document.getElementById('board');
    const btnAddCategory = document.getElementById('btn-add-category');
    const btnImportCsv = document.getElementById('btn-import-csv');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnViewDeleted = document.getElementById('btn-view-deleted');
    const btnToggleDeleteMode = document.getElementById('btn-toggle-delete-mode');
    const btnToggleAllCategories = document.getElementById('btn-toggle-all-categories');
    const fileUpload = document.getElementById('file-upload');

    // Filters and Indicators
    const filterSearch = document.getElementById('filter-search');
    const filterPriority = document.getElementById('filter-priority');
    const indicatorBtns = document.querySelectorAll('.indicator-btn');

    // Indicators SVG Elements
    const indTotalCircle = document.getElementById('ind-total-circle');
    const indTotalVal = document.getElementById('ind-total-val');
    const indDoneCircle = document.getElementById('ind-done-circle');
    const indDoneVal = document.getElementById('ind-done-val');
    const indPendingCircle = document.getElementById('ind-pending-circle');
    const indPendingVal = document.getElementById('ind-pending-val');
    const indProgCircle = document.getElementById('ind-prog-circle');
    const indProgVal = document.getElementById('ind-prog-val');
    const indSchedCircle = document.getElementById('ind-sched-circle');
    const indSchedVal = document.getElementById('ind-sched-val');

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
    let currentFilterMode = 'all'; // all, completed, pending, progressive, scheduled

    // Helper Functions for Dates
    function getTodayString() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // Initialize
    loadData();
    checkTaskResets();
    renderBoard();
    updateIndicators();

    function checkTaskResets() {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // reset time to start of day
        let dataChanged = false;

        data.forEach(item => {
            if (item.Type === 'task' && !item.Deleted && item.ResetDays > 0 && item.IterationDate) {
                // Parse IterationDate
                const iterParts = item.IterationDate.split('-');
                if (iterParts.length === 3) {
                    const iterDate = new Date(iterParts[0], iterParts[1] - 1, iterParts[2]);
                    iterDate.setHours(0, 0, 0, 0);

                    // Add ResetDays
                    iterDate.setDate(iterDate.getDate() + item.ResetDays);

                    // Check if today >= IterationDate + ResetDays
                    if (today.getTime() >= iterDate.getTime()) {
                        if (item.Completed) {
                            item.Counter = (item.Counter || 0) + 1;
                            item.Completed = false;
                            item.IterationDate = getTodayString();
                            dataChanged = true;
                        } else {
                            // Optionally update IterationDate even if not completed, but requirements
                            // say: "si la tarea está marcada como hecha incrementará el contador, actualiza IterationDate y desmarca"
                            // So we only act if Completed is true, based on exact requirement text.
                        }
                    }
                }
            }
        });

        if (dataChanged) {
            saveData();
        }
    }

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
        let tasks = data.filter(i => i.Type === 'task' && i.ParentId === parentId && !i.Deleted);

        // Apply Filters
        const searchStr = filterSearch.value.trim().toLowerCase();
        if (searchStr) {
            tasks = tasks.filter(t => t.Name.toLowerCase().includes(searchStr));
        }

        const prio = parseInt(filterPriority.value);
        if (!isNaN(prio)) {
            tasks = tasks.filter(t => t.Priority >= prio);
        }

        if (currentFilterMode === 'completed') {
            tasks = tasks.filter(t => t.Completed);
        } else if (currentFilterMode === 'pending') {
            tasks = tasks.filter(t => !t.Completed);
        } else if (currentFilterMode === 'progressive') {
            tasks = tasks.filter(t => t.Percentage > 0);
        } else if (currentFilterMode === 'scheduled') {
            tasks = tasks.filter(t => t.ResetDays > 0);
        }

        return tasks.sort((a, b) => a.Order - b.Order);
    }

    // Indicators Calculation
    function updateIndicators() {
        const allTasks = data.filter(i => i.Type === 'task' && !i.Deleted);

        let sumTotal = 0;
        let sumDone = 0;
        let sumPending = 0; // Number of pending tasks
        let sumProg = 0; // Number of progressive tasks
        let sumSched = 0; // Number of scheduled tasks

        allTasks.forEach(t => {
            const val = 1 + t.Counter;
            sumTotal += val;

            if (t.Completed) {
                sumDone += val;
            } else {
                sumPending++; // Requirement: Number of pending tasks (not including counters as per clarification)
            }

            if (t.Percentage > 0) {
                sumProg++;
            }

            if (t.ResetDays > 0) {
                sumSched++;
            }
        });

        // Update Values
        indTotalVal.textContent = sumTotal;
        indDoneVal.textContent = sumDone;
        indPendingVal.textContent = sumPending;
        indProgVal.textContent = sumProg;
        indSchedVal.textContent = sumSched;

        // Update Circles (Radius = 20, Circumference = 125.6)
        const C = 125.6;

        const setCircle = (circle, val) => {
            if (sumTotal === 0) {
                circle.style.strokeDashoffset = C;
                return;
            }
            const percent = val / sumTotal;
            const offset = C - (percent * C);
            circle.style.strokeDashoffset = offset;
        };

        setCircle(indTotalCircle, sumTotal);
        setCircle(indDoneCircle, sumDone);
        setCircle(indPendingCircle, sumPending);
        setCircle(indProgCircle, sumProg);
        setCircle(indSchedCircle, sumSched);
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
            Deleted: false,
            // Categories don't technically need these but it's good for consistency
            Priority: 500,
            CreationDate: getTodayString(),
            IterationDate: getTodayString(),
            ResetDays: 0,
            Collapsed: false // Added for collapsing tasks
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
            Deleted: false,
            // New fields
            Priority: 500,
            CreationDate: getTodayString(),
            IterationDate: getTodayString(),
            ResetDays: 0
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
        updateIndicators();

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

            // Collapse/Expand Category Tasks
            const btnToggleCat = catEl.querySelector('.btn-toggle-category');
            const toggleIcon = btnToggleCat.querySelector('i');
            const catTaskList = catEl.querySelector('.task-list');

            if (cat.Collapsed) {
                catTaskList.classList.add('hidden');
                toggleIcon.classList.remove('fa-chevron-down');
                toggleIcon.classList.add('fa-chevron-up');
            }

            btnToggleCat.addEventListener('click', () => {
                const isCollapsed = catTaskList.classList.contains('hidden');
                updateItem(cat.Id, { Collapsed: !isCollapsed });
                renderBoard(); // Re-render to apply the class cleanly, or just toggle DOM (we re-render to keep it simple)
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
            catTaskList.dataset.categoryId = cat.Id;
            const tasks = getTasks(cat.Id);

            tasks.forEach(task => {
                const taskNode = createDOMTask(task);
                catTaskList.appendChild(taskNode);
            });

            board.appendChild(catNode);
        });

        // Init Sortable Categories
        sortableCategories = new Sortable(board, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            handle: '.category-drag-handle',
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
                handle: '.task-drag-handle',
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
        const badgesContainer = taskEl.querySelector('.task-badges-container');
        const expandIcon = taskEl.querySelector('.expand-icon-indicator');
        const btnDelete = taskEl.querySelector('.btn-delete-task');
        const expandedArea = taskEl.querySelector('.task-expanded');

        // Expanded elements
        const btnCountDec = taskEl.querySelector('.btn-counter-dec');
        const btnCountInc = taskEl.querySelector('.btn-counter-inc');
        const inputCount = taskEl.querySelector('.input-counter');
        const inputPercent = taskEl.querySelector('.input-percentage');
        const labelPercent = taskEl.querySelector('.label-percentage');
        const inputNote = taskEl.querySelector('.input-note');

        // "Más..." inputs
        const inputPriority = taskEl.querySelector('.input-priority');
        const inputCreationDate = taskEl.querySelector('.input-creation-date');
        const inputIterationDate = taskEl.querySelector('.input-iteration-date');
        const inputResetDays = taskEl.querySelector('.input-reset-days');

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

        inputPriority.value = task.Priority;
        inputCreationDate.value = task.CreationDate;
        inputIterationDate.value = task.IterationDate;
        inputResetDays.value = task.ResetDays;

        // Events
        cb.addEventListener('change', (e) => {
            const completed = e.target.checked;
            const updates = { Completed: completed };
            if (completed) {
                updates.IterationDate = getTodayString();
                nameInput.classList.add('line-through', 'text-gray-400');
            } else {
                nameInput.classList.remove('line-through', 'text-gray-400');
            }
            updateItem(task.Id, updates);
        });

        nameInput.addEventListener('change', (e) => {
            updateItem(task.Id, { Name: e.target.value });
        });

        btnDelete.addEventListener('click', () => {
            virtualDeleteItem(task.Id);
        });

        // Expand/Collapse
        badgesContainer.addEventListener('click', () => {
            expandedArea.classList.toggle('hidden');
            if (expandedArea.classList.contains('hidden')) {
                expandIcon.classList.remove('fa-chevron-up');
                expandIcon.classList.add('fa-chevron-down');
            } else {
                expandIcon.classList.remove('fa-chevron-down');
                expandIcon.classList.add('fa-chevron-up');
            }
        });

        // Counter
        const updateCounter = (val) => {
            const newVal = Math.max(0, val);
            const isInc = newVal > parseInt(inputCount.value);
            inputCount.value = newVal;
            counterVal.textContent = newVal;

            const updates = { Counter: newVal };
            if (isInc) {
                updates.IterationDate = getTodayString();
            }
            updateItem(task.Id, updates);
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

        // More... Inputs
        inputPriority.addEventListener('change', (e) => {
            let val = parseInt(e.target.value);
            if (isNaN(val) || val < 1) val = 1;
            if (val > 1000) val = 1000;
            e.target.value = val;
            updateItem(task.Id, { Priority: val });
        });

        inputCreationDate.addEventListener('change', (e) => {
            updateItem(task.Id, { CreationDate: e.target.value });
        });

        inputIterationDate.addEventListener('change', (e) => {
            updateItem(task.Id, { IterationDate: e.target.value });
        });

        inputResetDays.addEventListener('change', (e) => {
            let val = parseInt(e.target.value);
            if (isNaN(val) || val < 0) val = 0;
            e.target.value = val;
            updateItem(task.Id, { ResetDays: val });
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
            Deleted: i.Deleted,
            Priority: i.Priority !== undefined ? i.Priority : 500,
            CreationDate: i.CreationDate || '',
            IterationDate: i.IterationDate || '',
            ResetDays: i.ResetDays !== undefined ? i.ResetDays : 0,
            Collapsed: i.Collapsed !== undefined ? i.Collapsed : false
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
            Deleted: String(row.Deleted).toLowerCase() === 'true',
            Priority: parseInt(row.Priority) !== null && !isNaN(parseInt(row.Priority)) ? parseInt(row.Priority) : 500,
            CreationDate: row.CreationDate || getTodayString(),
            IterationDate: row.IterationDate || getTodayString(),
            ResetDays: parseInt(row.ResetDays) || 0,
            Collapsed: String(row.Collapsed).toLowerCase() === 'true'
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

    // Header Actions
    btnToggleDeleteMode.addEventListener('click', () => {
        document.body.classList.toggle('delete-mode-active');
        btnToggleDeleteMode.classList.toggle('bg-red-500');
        btnToggleDeleteMode.classList.toggle('text-white');
    });

    btnToggleAllCategories.addEventListener('click', () => {
        const categories = getCategories();
        // Check if any is open. If at least one is open, close all. Otherwise open all.
        const anyOpen = categories.some(c => !c.Collapsed);
        const newState = anyOpen; // if any open, set Collapsed to true

        categories.forEach(c => {
            updateItem(c.Id, { Collapsed: newState });
        });
        renderBoard();
    });

    // Filtering
    let searchTimeout;
    filterSearch.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(renderBoard, 300);
    });

    filterPriority.addEventListener('change', () => {
        let val = parseInt(filterPriority.value);
        if (isNaN(val) || val < 1) {
            val = 1;
            filterPriority.value = 1;
        }
        renderBoard();
    });

    indicatorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            // Toggle off if already selected
            if (currentFilterMode === filter && filter !== 'all') {
                currentFilterMode = 'all';
            } else {
                currentFilterMode = filter;
            }

            // Update UI for buttons
            indicatorBtns.forEach(b => {
                b.classList.remove('opacity-100');
                b.classList.add('opacity-50');
            });

            if (currentFilterMode === 'all') {
                const totalBtn = document.querySelector('[data-filter="all"]');
                totalBtn.classList.remove('opacity-50');
                totalBtn.classList.add('opacity-100');
            } else {
                const activeBtn = document.querySelector(`[data-filter="${currentFilterMode}"]`);
                activeBtn.classList.remove('opacity-50');
                activeBtn.classList.add('opacity-100');
            }

            renderBoard();
        });
    });

    // Initial indicator UI setup
    document.querySelector('[data-filter="all"]').classList.remove('opacity-50');
    document.querySelector('[data-filter="all"]').classList.add('opacity-100');
});
