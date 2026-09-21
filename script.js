const STORAGE_KEY = "daylist-todos";

const state = {
  todos: loadTodos(),
  filter: "all",
};

const elements = {
  form: document.querySelector("#todoForm"),
  input: document.querySelector("#todoInput"),
  list: document.querySelector("#todoList"),
  emptyState: document.querySelector("#emptyState"),
  emptyTitle: document.querySelector("#emptyTitle"),
  emptyCopy: document.querySelector("#emptyCopy"),
  completedCount: document.querySelector("#completedCount"),
  totalCount: document.querySelector("#totalCount"),
  progressPercent: document.querySelector("#progressPercent"),
  progressFill: document.querySelector("#progressFill"),
  progressTrack: document.querySelector(".progress-track"),
  visibleCount: document.querySelector("#visibleCount"),
  todayLabel: document.querySelector("#todayLabel"),
  tabs: document.querySelectorAll(".filter-tab"),
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
  if (state.filter === "active") return state.todos.filter((todo) => !todo.isComplete);
  if (state.filter === "completed") return state.todos.filter((todo) => todo.isComplete);
  return state.todos;
}

function render() {
  const completed = state.todos.filter((todo) => todo.isComplete).length;
  const total = state.todos.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const visibleTodos = getVisibleTodos();

  elements.completedCount.textContent = completed;
  elements.totalCount.textContent = total;
  elements.progressPercent.textContent = `${percentage}%`;
  elements.progressFill.style.width = `${percentage}%`;
  elements.progressTrack.setAttribute("aria-valuenow", percentage);
  elements.visibleCount.textContent = `${visibleTodos.length} ${visibleTodos.length === 1 ? "task" : "tasks"}`;
  elements.list.innerHTML = visibleTodos.map(createTodoMarkup).join("");
  elements.emptyState.hidden = visibleTodos.length > 0;

  if (total === 0 && state.filter === "all") {
    elements.emptyTitle.textContent = "아직 할 일이 없어요";
    elements.emptyCopy.textContent = "위 입력창에 오늘의 첫 할 일을 추가해보세요.";
  } else if (state.filter === "active") {
    elements.emptyTitle.textContent = "진행 중인 일이 없어요";
    elements.emptyCopy.textContent = "모든 할 일을 끝냈어요. 정말 잘했어요!";
  } else {
    elements.emptyTitle.textContent = "완료한 일이 없어요";
    elements.emptyCopy.textContent = "할 일을 끝내고 체크하면 이곳에 모여요.";
  }
}

function createTodoMarkup(todo) {
  const completeClass = todo.isComplete ? " bg-[#fbfdfb]" : "";
  const checkClass = todo.isComplete
    ? " border-mint-deep bg-mint-deep text-white"
    : " text-transparent";
  const safeText = escapeHtml(todo.text);
  return `<article class="todo-item${completeClass} flex items-center gap-[15px] rounded-lg border border-line bg-white p-[17px_18px] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" data-id="${todo.id}">
    <button class="todo-check relative grid h-[22px] w-[22px] flex-none place-items-center rounded-full border-[1.5px] border-[#b8c5bd] bg-white p-0 text-[13px] font-bold transition after:content-['✓'] hover:border-mint-deep${checkClass}" type="button" aria-label="${todo.isComplete ? "완료 취소" : "완료 처리"}" data-action="toggle"></button>
    <p class="todo-text m-0 min-w-0 flex-1 [overflow-wrap:anywhere] text-[15px] leading-[1.45]${todo.isComplete ? " text-[#9ba59f] line-through" : ""}">${safeText}</p>
    <button class="edit-button rounded px-1 py-[5px] text-xs font-bold text-muted transition hover:text-mint-deep" type="button" aria-label="할 일 수정" data-action="edit">편집</button>
    <button class="delete-button rounded p-[5px] text-[19px] leading-none text-[#a0aaa4] transition hover:text-coral" type="button" aria-label="할 일 삭제" data-action="delete">×</button>
  </article>`;
}

function createEditMarkup(todo) {
  return `<form class="flex flex-1 items-center gap-2" data-action="save-edit">
    <label class="sr-only" for="edit-${todo.id}">할 일 수정</label>
    <input id="edit-${todo.id}" class="min-w-0 flex-1 rounded-[5px] border border-mint-deep px-[11px] py-[9px] text-ink outline-none ring-[3px] ring-mint-deep/10" name="text" type="text" maxlength="120" value="${escapeHtml(todo.text)}" required />
    <button class="rounded-[5px] border-0 bg-mint-deep px-2.5 py-2 text-xs font-bold text-white" type="submit">저장</button>
    <button class="rounded-[5px] border-0 bg-[#edf2ed] px-2.5 py-2 text-xs font-bold text-muted" type="button" data-action="cancel-edit">취소</button>
  </form>`;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[character]));
}

function addTodo(text) {
  state.todos.unshift({ id: crypto.randomUUID(), text, isComplete: false, createdAt: new Date().toISOString() });
  saveTodos();
  render();
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = elements.input.value.trim();
  if (!text) return;
  addTodo(text);
  elements.form.reset();
  elements.input.focus();
});

elements.list.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const todoItem = actionButton.closest("[data-id]");
  const todo = state.todos.find((item) => item.id === todoItem.dataset.id);
  if (!todo) return;
  if (actionButton.dataset.action === "save-edit") return;
  if (actionButton.dataset.action === "edit") {
    todoItem.innerHTML = createEditMarkup(todo);
    todoItem.querySelector(".edit-input").focus();
    todoItem.querySelector(".edit-input").select();
    return;
  }
  if (actionButton.dataset.action === "cancel-edit") {
    render();
    return;
  }
  if (actionButton.dataset.action === "toggle") todo.isComplete = !todo.isComplete;
  if (actionButton.dataset.action === "delete") state.todos = state.todos.filter((item) => item.id !== todo.id);
  saveTodos();
  render();
});

elements.list.addEventListener("submit", (event) => {
  if (event.target.dataset.action !== "save-edit") return;
  event.preventDefault();
  const todoItem = event.target.closest("[data-id]");
  const todo = state.todos.find((item) => item.id === todoItem.dataset.id);
  const nextText = new FormData(event.target).get("text").trim();
  if (!todo || !nextText) return;
  todo.text = nextText;
  saveTodos();
  render();
});

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.filter = tab.dataset.filter;
    elements.tabs.forEach((item) => {
      const isSelected = item === tab;
      item.classList.toggle("is-active", isSelected);
      item.classList.toggle("text-ink", isSelected);
      item.classList.toggle("text-muted", !isSelected);
      item.classList.toggle("after:bg-coral", isSelected);
      item.classList.toggle("after:bg-transparent", !isSelected);
      item.setAttribute("aria-selected", isSelected);
    });
    render();
  });
});

elements.todayLabel.textContent = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric", month: "long", day: "numeric", weekday: "short",
}).format(new Date());

render();
/*
const STORAGE_KEY = "daylist-todos";

const state = {
  todos: loadTodos(),
  filter: "all",
};

const elements = {
  form: document.querySelector("#todoForm"),
  input: document.querySelector("#todoInput"),
  list: document.querySelector("#todoList"),
  emptyState: document.querySelector("#emptyState"),
  emptyTitle: document.querySelector("#emptyTitle"),
  emptyCopy: document.querySelector("#emptyCopy"),
  completedCount: document.querySelector("#completedCount"),
  totalCount: document.querySelector("#totalCount"),
  progressPercent: document.querySelector("#progressPercent"),
  progressFill: document.querySelector("#progressFill"),
  progressTrack: document.querySelector(".progress-track"),
  visibleCount: document.querySelector("#visibleCount"),
  todayLabel: document.querySelector("#todayLabel"),
  tabs: document.querySelectorAll(".filter-tab"),
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
  if (state.filter === "active") return state.todos.filter((todo) => !todo.isComplete);
  if (state.filter === "completed") return state.todos.filter((todo) => todo.isComplete);
  return state.todos;
}

function render() {
  const completed = state.todos.filter((todo) => todo.isComplete).length;
  const total = state.todos.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const visibleTodos = getVisibleTodos();

  elements.completedCount.textContent = completed;
  elements.totalCount.textContent = total;
  elements.progressPercent.textContent = `${percentage}%`;
  elements.progressFill.style.width = `${percentage}%`;
  elements.progressTrack.setAttribute("aria-valuenow", percentage);
  elements.visibleCount.textContent = `${visibleTodos.length} ${visibleTodos.length === 1 ? "task" : "tasks"}`;
  elements.list.innerHTML = visibleTodos.map(createTodoMarkup).join("");
  elements.emptyState.hidden = visibleTodos.length > 0;

  if (total === 0 && state.filter === "all") {
    elements.emptyTitle.textContent = "아직 할 일이 없어요";
    elements.emptyCopy.textContent = "위 입력창에 오늘의 첫 할 일을 추가해보세요.";
  } else if (state.filter === "active") {
    elements.emptyTitle.textContent = "진행 중인 일이 없어요";
    elements.emptyCopy.textContent = "모든 할 일을 끝냈어요. 정말 잘했어요!";
  } else {
    elements.emptyTitle.textContent = "완료한 일이 없어요";
    elements.emptyCopy.textContent = "할 일을 끝내고 체크하면 이곳에 모여요.";
  }
}

function createTodoMarkup(todo) {
  const completeClass = todo.isComplete ? " bg-[#fbfdfb]" : "";
  const checkClass = todo.isComplete
    ? " border-mint-deep bg-mint-deep text-white"
    : " text-transparent";
  const safeText = escapeHtml(todo.text);
  return `<article class="todo-item${completeClass} flex items-center gap-[15px] rounded-lg border border-line bg-white p-[17px_18px] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" data-id="${todo.id}">
    <button class="todo-check relative grid h-[22px] w-[22px] flex-none place-items-center rounded-full border-[1.5px] border-[#b8c5bd] bg-white p-0 text-[13px] font-bold transition after:content-['✓'] hover:border-mint-deep${checkClass}" type="button" aria-label="${todo.isComplete ? "완료 취소" : "완료 처리"}" data-action="toggle"></button>
    <p class="todo-text m-0 min-w-0 flex-1 [overflow-wrap:anywhere] text-[15px] leading-[1.45]${todo.isComplete ? " text-[#9ba59f] line-through" : ""}">${safeText}</p>
    <button class="edit-button rounded px-1 py-[5px] text-xs font-bold text-muted transition hover:text-mint-deep" type="button" aria-label="할 일 수정" data-action="edit">편집</button>
    <button class="delete-button rounded p-[5px] text-[19px] leading-none text-[#a0aaa4] transition hover:text-coral" type="button" aria-label="할 일 삭제" data-action="delete">×</button>
  </article>`;
}

function createEditMarkup(todo) {
  return `<form class="flex flex-1 items-center gap-2" data-action="save-edit">
    <label class="sr-only" for="edit-${todo.id}">할 일 수정</label>
    <input id="edit-${todo.id}" class="min-w-0 flex-1 rounded-[5px] border border-mint-deep px-[11px] py-[9px] text-ink outline-none ring-[3px] ring-mint-deep/10" name="text" type="text" maxlength="120" value="${escapeHtml(todo.text)}" required />
    <button class="rounded-[5px] border-0 bg-mint-deep px-2.5 py-2 text-xs font-bold text-white" type="submit">저장</button>
    <button class="rounded-[5px] border-0 bg-[#edf2ed] px-2.5 py-2 text-xs font-bold text-muted" type="button" data-action="cancel-edit">취소</button>
  </form>`;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[character]));
}

function addTodo(text) {
  state.todos.unshift({ id: crypto.randomUUID(), text, isComplete: false, createdAt: new Date().toISOString() });
  saveTodos();
  render();
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = elements.input.value.trim();
  if (!text) return;
  addTodo(text);
  elements.form.reset();
  elements.input.focus();
});

elements.list.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const todoItem = actionButton.closest("[data-id]");
  const todo = state.todos.find((item) => item.id === todoItem.dataset.id);
  if (!todo) return;
  if (actionButton.dataset.action === "save-edit") return;
  if (actionButton.dataset.action === "edit") {
    todoItem.innerHTML = createEditMarkup(todo);
    todoItem.querySelector(".edit-input").focus();
    todoItem.querySelector(".edit-input").select();
    return;
  }
  if (actionButton.dataset.action === "cancel-edit") {
    render();
    return;
  }
  if (actionButton.dataset.action === "toggle") todo.isComplete = !todo.isComplete;
  if (actionButton.dataset.action === "delete") state.todos = state.todos.filter((item) => item.id !== todo.id);
  saveTodos();
  render();
});

elements.list.addEventListener("submit", (event) => {
  if (event.target.dataset.action !== "save-edit") return;
  event.preventDefault();
  const todoItem = event.target.closest("[data-id]");
  const todo = state.todos.find((item) => item.id === todoItem.dataset.id);
  const nextText = new FormData(event.target).get("text").trim();
  if (!todo || !nextText) return;
  todo.text = nextText;
  saveTodos();
  render();
});

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.filter = tab.dataset.filter;
    elements.tabs.forEach((item) => {
      const isSelected = item === tab;
      item.classList.toggle("is-active", isSelected);
      item.classList.toggle("text-ink", isSelected);
      item.classList.toggle("text-muted", !isSelected);
      item.classList.toggle("after:bg-coral", isSelected);
      item.classList.toggle("after:bg-transparent", !isSelected);
      item.setAttribute("aria-selected", isSelected);
    });
    render();
  });
});

elements.todayLabel.textContent = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric", month: "long", day: "numeric", weekday: "short",
}).format(new Date());

render();
*/