const STORAGE_KEY = 'focus-list-todos';

const state = {
  todos: loadTodos(),
  filter: 'all'
};

const elements = {
  form: document.querySelector('#todoForm'),
  input: document.querySelector('#todoInput'),
  list: document.querySelector('#todoList'),
  empty: document.querySelector('#emptyState'),
  emptyTitle: document.querySelector('#emptyTitle'),
  emptyDescription: document.querySelector('#emptyDescription'),
  taskCount: document.querySelector('#taskCount'),
  progressText: document.querySelector('#progressText'),
  progressPercent: document.querySelector('#progressPercent'),
  progressBar: document.querySelector('#progressBar'),
  todayLabel: document.querySelector('#todayLabel'),
  filters: [...document.querySelectorAll('.filter-tab')]
};

function loadTodos() {
  try {
    const savedTodos = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(savedTodos) ? savedTodos : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function getVisibleTodos() {
  if (state.filter === 'active') return state.todos.filter((todo) => !todo.isComplete);
  if (state.filter === 'completed') return state.todos.filter((todo) => todo.isComplete);
  return state.todos;
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
}

function render() {
  const completedCount = state.todos.filter((todo) => todo.isComplete).length;
  const visibleTodos = getVisibleTodos();
  const progress = state.todos.length ? Math.round((completedCount / state.todos.length) * 100) : 0;

  elements.list.replaceChildren(...visibleTodos.map(createTodoElement));
  elements.empty.hidden = visibleTodos.length > 0;
  elements.emptyTitle.textContent = state.todos.length && state.filter !== 'all' ? '이 필터에는 할 일이 없어요' : '아직 할 일이 없어요';
  elements.emptyDescription.textContent = state.todos.length && state.filter !== 'all' ? '다른 탭을 선택하거나 새로운 할 일을 추가해보세요.' : '위 입력창에 오늘의 첫 할 일을 적어보세요.';
  elements.taskCount.textContent = `${state.todos.length} items`;
  elements.progressText.textContent = `${completedCount} / ${state.todos.length} 완료`;
  elements.progressPercent.textContent = `${progress}%`;
  elements.progressBar.setAttribute('aria-valuenow', progress);
  elements.progressBar.querySelector('span').style.width = `${progress}%`;

  const counts = {
    all: state.todos.length,
    active: state.todos.filter((todo) => !todo.isComplete).length,
    completed: completedCount
  };
  elements.filters.forEach((filterButton) => {
    const isActive = filterButton.dataset.filter === state.filter;
    filterButton.classList.toggle('is-active', isActive);
    filterButton.classList.toggle('text-ink', isActive);
    filterButton.classList.toggle('text-muted', !isActive);
    filterButton.classList.toggle('after:h-0.5', isActive);
    filterButton.classList.toggle('after:h-0', !isActive);
    filterButton.setAttribute('aria-selected', isActive);
    filterButton.querySelector('span').textContent = counts[filterButton.dataset.filter];
  });
}

function createTodoElement(todo) {
  const item = document.createElement('article');
  item.className = `todo-item flex min-h-[66px] items-center gap-3.5 border border-line bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card ${todo.isComplete ? 'is-complete' : ''}`;
  item.dataset.id = todo.id;

  const checkButton = document.createElement('button');
  checkButton.className = `todo-check grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-[1.5px] border-[#a9b7b1] bg-white text-[13px] text-white transition hover:border-mint-deep ${todo.isComplete ? 'border-mint-deep bg-mint-deep after:content-[\'✓\']' : ''}`;
  checkButton.type = 'button';
  checkButton.setAttribute('aria-label', todo.isComplete ? '완료 취소' : '완료 처리');
  checkButton.addEventListener('click', () => toggleTodo(todo.id));

  const text = document.createElement('span');
  text.className = `todo-text min-w-0 flex-1 break-words text-sm leading-[1.4] ${todo.isComplete ? 'text-[#9aa8a2] line-through decoration-coral' : ''}`;
  text.textContent = todo.text;

  const date = document.createElement('time');
  date.className = 'todo-date whitespace-nowrap text-[11px] text-[#a5b0ab] max-[620px]:hidden';
  date.dateTime = new Date(todo.createdAt).toISOString();
  date.textContent = formatDate(todo.createdAt);

  const editButton = document.createElement('button');
  editButton.className = 'edit-button border-0 bg-transparent px-[3px] py-[7px] text-[11px] font-bold text-muted transition hover:text-mint-deep';
  editButton.type = 'button';
  editButton.setAttribute('aria-label', `${todo.text} 수정`);
  editButton.textContent = '수정';
  editButton.addEventListener('click', () => startEditing(todo, item, text, editButton));

  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-button h-7 w-7 border-0 bg-transparent text-[19px] leading-none text-[#a5b0ab] opacity-65 transition hover:text-coral hover:opacity-100';
  deleteButton.type = 'button';
  deleteButton.setAttribute('aria-label', `${todo.text} 삭제`);
  deleteButton.textContent = '×';
  deleteButton.addEventListener('click', () => deleteTodo(todo.id));

  item.append(checkButton, text, date, editButton, deleteButton);
  return item;
}

function startEditing(todo, item, textElement, editButton) {
  const input = document.createElement('input');
  input.className = 'edit-input min-w-0 flex-1 border border-mint-deep px-2.5 py-2 text-sm text-ink outline-none';
  input.type = 'text';
  input.maxLength = 120;
  input.value = todo.text;

  const saveButton = document.createElement('button');
  saveButton.className = 'edit-action save-edit border-0 bg-transparent px-1.5 py-[7px] text-[11px] font-bold text-mint-deep';
  saveButton.type = 'button';
  saveButton.textContent = '저장';

  const cancelButton = document.createElement('button');
  cancelButton.className = 'edit-action cancel-edit border-0 bg-transparent px-1.5 py-[7px] text-[11px] font-bold text-muted';
  cancelButton.type = 'button';
  cancelButton.textContent = '취소';

  const editActions = document.createElement('span');
  editActions.className = 'edit-actions flex shrink-0 gap-[5px]';
  editActions.append(saveButton, cancelButton);

  const saveEdit = () => {
    const nextText = input.value.trim();
    if (!nextText) {
      input.focus();
      return;
    }
    state.todos = state.todos.map((currentTodo) => currentTodo.id === todo.id ? { ...currentTodo, text: nextText } : currentTodo);
    saveTodos();
    render();
  };

  const cancelEdit = () => render();
  textElement.replaceWith(input);
  editButton.replaceWith(editActions);
  input.focus();
  input.select();
  saveButton.addEventListener('click', saveEdit);
  cancelButton.addEventListener('click', cancelEdit);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') saveEdit();
    if (event.key === 'Escape') cancelEdit();
  });
}

function addTodo(text) {
  state.todos.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    text,
    isComplete: false,
    createdAt: Date.now()
  });
  saveTodos();
  render();
}

function toggleTodo(id) {
  state.todos = state.todos.map((todo) => todo.id === id ? { ...todo, isComplete: !todo.isComplete } : todo);
  saveTodos();
  render();
}

function deleteTodo(id) {
  state.todos = state.todos.filter((todo) => todo.id !== id);
  saveTodos();
  render();
}

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = elements.input.value.trim();
  if (!text) return;
  addTodo(text);
  elements.form.reset();
  elements.input.focus();
});

elements.filters.forEach((filterButton) => {
  filterButton.addEventListener('click', () => {
    state.filter = filterButton.dataset.filter;
    render();
  });
});

elements.todayLabel.textContent = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long' }).format(new Date());
render();
