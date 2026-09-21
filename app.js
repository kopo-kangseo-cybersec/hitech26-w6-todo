const STORAGE_KEY = "daily-rhythm-todos";

const state = {
  todos: loadTodos(),
  filter: "all"
};

const elements = {
  form: document.querySelector("#todoForm"),
  input: document.querySelector("#todoInput"),
  list: document.querySelector("#todoList"),
  empty: document.querySelector("#emptyState"),
  emptyTitle: document.querySelector("#emptyTitle"),
  emptyDescription: document.querySelector("#emptyDescription"),
  completedCount: document.querySelector("#completedCount"),
  totalCount: document.querySelector("#totalCount"),
  visibleCount: document.querySelector("#visibleCount"),
  progressBar: document.querySelector("#progressBar"),
  progressTrack: document.querySelector(".progress-track"),
  todayLabel: document.querySelector("#todayLabel"),
  tabs: document.querySelectorAll(".filter-tab")
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
  const completedTodos = state.todos.filter((todo) => todo.isComplete).length;
  const visibleTodos = getVisibleTodos();
  const totalTodos = state.todos.length;
  const progress = totalTodos === 0 ? 0 : Math.round((completedTodos / totalTodos) * 100);

  elements.completedCount.textContent = completedTodos;
  elements.totalCount.textContent = totalTodos;
  elements.visibleCount.textContent = `${visibleTodos.length}개`;
  elements.progressBar.style.width = `${progress}%`;
  elements.progressTrack.setAttribute("aria-valuenow", progress);
  elements.progressTrack.setAttribute("aria-valuetext", `${progress}% 완료`);

  elements.tabs.forEach((tab) => {
    const filter = tab.dataset.filter;
    const count = filter === "all"
      ? totalTodos
      : filter === "active"
        ? totalTodos - completedTodos
        : completedTodos;
    tab.querySelector("span").textContent = count;
    const isActive = filter === state.filter;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-current", isActive ? "page" : "false");
  });

  elements.list.replaceChildren(...visibleTodos.map(createTodoElement));
  elements.empty.hidden = visibleTodos.length > 0;
  if (totalTodos === 0) {
    elements.emptyTitle.textContent = "아직 할 일이 없어요";
    elements.emptyDescription.textContent = "작은 일부터 하나씩 시작해볼까요?";
  } else if (visibleTodos.length === 0) {
    elements.emptyTitle.textContent = state.filter === "completed" ? "완료한 일이 없어요" : "진행 중인 일이 없어요";
    elements.emptyDescription.textContent = "다른 탭에서 할 일을 확인해보세요.";
  }
}

function createTodoElement(todo) {
  const item = document.createElement("article");
  item.className = `todo-item${todo.isComplete ? " is-complete" : ""}`;
  item.dataset.id = todo.id;

  const checkButton = document.createElement("button");
  checkButton.className = `todo-check${todo.isComplete ? " is-complete" : ""}`;
  checkButton.type = "button";
  checkButton.setAttribute("aria-label", todo.isComplete ? "완료 취소" : "완료 처리");
  checkButton.innerHTML = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\"><path d=\"m5 12 4 4L19 6\"/></svg>";
  checkButton.addEventListener("click", () => toggleTodo(todo.id));

  const text = document.createElement("p");
  text.className = "todo-text";
  text.textContent = todo.text;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", "할 일 삭제");
  deleteButton.textContent = "×";
  deleteButton.addEventListener("click", () => deleteTodo(todo.id));

  item.append(checkButton, text, deleteButton);
  return item;
}

function addTodo(text) {
  state.todos.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    text,
    isComplete: false,
    createdAt: new Date().toISOString()
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

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = elements.input.value.trim();
  if (!text) return;
  addTodo(text);
  elements.form.reset();
  elements.input.focus();
});

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.filter = tab.dataset.filter;
    render();
  });
});

elements.todayLabel.textContent = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short"
}).format(new Date());

render();
