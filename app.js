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

function editTodo(id, newText) {
  const trimmed = newText.trim();
  if (!trimmed) return;
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, text: trimmed } : todo
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

const TODO_ITEM_CLASSES =
  "todo-item flex items-center gap-2.5 px-3 py-2.5 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white";
const TODO_TEXT_CLASSES = "todo-text flex-1 break-words cursor-pointer";
const TODO_TEXT_COMPLETED_CLASSES = "line-through text-gray-400";

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
    li.className = TODO_ITEM_CLASSES + (todo.isComplete ? " completed" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "w-[18px] h-[18px] cursor-pointer accent-indigo-600";
    checkbox.checked = todo.isComplete;
    checkbox.addEventListener("change", () => toggleTodo(todo.id));

    const text = document.createElement("span");
    text.className =
      TODO_TEXT_CLASSES + (todo.isComplete ? " " + TODO_TEXT_COMPLETED_CLASSES : "");
    text.textContent = todo.text;
    text.title = "더블클릭하여 수정";
    text.addEventListener("dblclick", () => startEdit(li, todo));

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn border-none bg-transparent cursor-pointer text-sm px-2 py-1 text-indigo-600 hover:underline";
    editBtn.type = "button";
    editBtn.textContent = "수정";
    editBtn.addEventListener("click", () => startEdit(li, todo));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn border-none bg-transparent cursor-pointer text-sm px-2 py-1 text-red-500 hover:underline";
    deleteBtn.type = "button";
    deleteBtn.textContent = "삭제";
    deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

    li.append(checkbox, text, editBtn, deleteBtn);
    list.appendChild(li);
  }
}

function startEdit(li, todo) {
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.className =
    "edit-input flex-1 px-2 py-1.5 border border-indigo-600 rounded-md text-[0.95rem] font-inherit";
  editInput.value = todo.text;
  editInput.maxLength = 200;

  const finishEdit = () => {
    editTodo(todo.id, editInput.value);
  };

  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finishEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      render();
    }
  });
  editInput.addEventListener("blur", finishEdit);

  const textEl = li.querySelector(".todo-text");
  textEl.replaceWith(editInput);
  editInput.focus();
  editInput.select();
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

const FILTER_TAB_ACTIVE_CLASSES = ["bg-white", "text-indigo-600", "font-semibold", "shadow-sm"];
const FILTER_TAB_INACTIVE_CLASSES = ["bg-transparent", "text-gray-500"];

filterTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    currentFilter = tab.dataset.filter;
    filterTabs.forEach((t) => {
      const isActive = t === tab;
      t.classList.remove(...FILTER_TAB_ACTIVE_CLASSES, ...FILTER_TAB_INACTIVE_CLASSES);
      t.classList.add(...(isActive ? FILTER_TAB_ACTIVE_CLASSES : FILTER_TAB_INACTIVE_CLASSES));
      t.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    render();
  });
});

render();
