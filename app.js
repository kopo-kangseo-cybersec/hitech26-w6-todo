const STORAGE_KEY = "todo-list-items";

/** @typedef {{ id: string, text: string, isComplete: boolean, createdAt: number }} TodoItem */

/** @type {TodoItem[]} */
let todos = loadTodos();
let currentFilter = "all"; // "all" | "active" | "completed"

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const emptyState = document.getElementById("empty-state");
const progressCount = document.getElementById("progress-count");
const progressFill = document.getElementById("progress-fill");
const filterTabs = document.querySelectorAll(".filter-tab");

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function createTodo(text) {
  return {
    id: crypto.randomUUID(),
    text,
    isComplete: false,
    createdAt: Date.now(),
  };
}

function addTodo(text) {
  todos.unshift(createTodo(text));
  saveTodos();
  render();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  render();
}

function toggleTodo(id) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, isComplete: !todo.isComplete } : todo
  );
  saveTodos();
  render();
}

function getFilteredTodos() {
  if (currentFilter === "active") return todos.filter((t) => !t.isComplete);
  if (currentFilter === "completed") return todos.filter((t) => t.isComplete);
  return todos;
}

function renderProgress() {
  const total = todos.length;
  const completed = todos.filter((t) => t.isComplete).length;
  progressCount.textContent = `${completed} / ${total} 완료`;
  progressFill.style.width = total === 0 ? "0%" : `${(completed / total) * 100}%`;
}

function renderList() {
  const filtered = getFilteredTodos();
  list.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.hidden = false;
    emptyState.textContent =
      todos.length === 0
        ? "할 일이 없습니다. 새로운 할 일을 추가해보세요."
        : "표시할 항목이 없습니다.";
    return;
  }

  emptyState.hidden = true;

  for (const todo of filtered) {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.isComplete ? " completed" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.isComplete;
    checkbox.addEventListener("change", () => toggleTodo(todo.id));

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.type = "button";
    deleteBtn.textContent = "삭제";
    deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

    li.append(checkbox, text, deleteBtn);
    list.appendChild(li);
  }
}

function render() {
  renderProgress();
  renderList();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTodo(text);
  input.value = "";
  input.focus();
});

filterTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    currentFilter = tab.dataset.filter;
    filterTabs.forEach((t) => {
      t.classList.toggle("active", t === tab);
      t.setAttribute("aria-selected", t === tab ? "true" : "false");
    });
    render();
  });
});

render();
