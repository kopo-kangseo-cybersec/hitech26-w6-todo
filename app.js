const STORAGE_KEY = "today-todos";
let tasks = loadTasks();
let currentFilter = "all";
let editingTaskId = null;

const addForm = document.querySelector("#add-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyDescription = document.querySelector("#empty-description");
const progressNumber = document.querySelector("#progress-number");
const progressFill = document.querySelector("#progress-fill");
const progressTrack = document.querySelector(".progress-track");

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(savedTasks) ? savedTasks : [];
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function visibleTasks() {
  if (currentFilter === "active") return tasks.filter((task) => !task.isComplete);
  if (currentFilter === "completed") return tasks.filter((task) => task.isComplete);
  return tasks;
}

function render() {
  const filteredTasks = visibleTasks();
  taskList.innerHTML = filteredTasks.map((task) => `
    <li class="task-item task-appear flex min-h-[66px] items-center gap-[13px] border-b border-[#ebe6de] px-2.5 py-3 pl-3 last:border-b-0 ${task.isComplete ? "completed" : ""}" data-id="${task.id}">
      ${editingTaskId === task.id ? `
        <div class="flex w-full items-center gap-2.5 max-sm:flex-col max-sm:items-stretch">
          <input class="min-w-0 flex-1 rounded border border-[#dc674f] bg-white px-3 py-2.5 text-[#252421] outline-none ring-4 ring-[#dc674f]/[.12]" type="text" maxlength="120" value="${escapeHtml(task.text)}" aria-label="${escapeHtml(task.text)} 수정">
          <div class="flex flex-none gap-1 max-sm:justify-end">
            <button class="rounded bg-[#252421] px-2.5 py-2 text-[.78rem] font-bold text-white transition hover:bg-[#a84131]" type="button" data-action="save-edit">저장</button>
            <button class="rounded bg-[#f0ece4] px-2.5 py-2 text-[.78rem] font-bold text-[#77736b] transition hover:text-[#252421]" type="button" data-action="cancel-edit">취소</button>
          </div>
        </div>
      ` : `
        <button class="grid h-[25px] w-[25px] flex-none place-items-center rounded-full border-[1.5px] border-[#a9a399] p-0 text-[.8rem] text-white transition hover:border-[#dc674f] ${task.isComplete ? "border-[#dc674f] bg-[#dc674f]" : "bg-transparent"}" type="button" data-action="toggle" aria-label="${task.isComplete ? "완료 취소" : "완료 처리"}">${task.isComplete ? "✓" : ""}</button>
        <span class="min-w-0 flex-1 overflow-wrap-anywhere text-[.98rem] leading-[1.45] ${task.isComplete ? "text-[#77736b] line-through decoration-[#77736b]" : ""}">${escapeHtml(task.text)}</span>
        <button class="rounded p-2 text-[.78rem] text-[#77736b] transition hover:text-[#252421]" type="button" data-action="edit" aria-label="${escapeHtml(task.text)} 수정">수정</button>
        <button class="rounded p-2 text-[.78rem] text-[#aaa39a] transition hover:text-[#a84131]" type="button" data-action="delete" aria-label="${escapeHtml(task.text)} 삭제">삭제</button>
      `}
    </li>
  `).join("");

  emptyState.hidden = filteredTasks.length > 0;
  if (tasks.length === 0) {
    emptyTitle.textContent = "아직 할 일이 없어요.";
    emptyDescription.textContent = "위 입력창에서 오늘의 첫 일을 추가해 보세요.";
  } else if (currentFilter === "active") {
    emptyTitle.textContent = "모두 끝냈어요.";
    emptyDescription.textContent = "진행 중인 할 일이 없습니다.";
  } else {
    emptyTitle.textContent = "완료한 일이 없어요.";
    emptyDescription.textContent = "할 일을 끝내면 이곳에 모아둘게요.";
  }

  const completedCount = tasks.filter((task) => task.isComplete).length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);
  progressNumber.textContent = `${progress}%`;
  progressFill.style.width = `${progress}%`;
  progressTrack.setAttribute("aria-valuenow", progress);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[character]));
}

function saveTaskEdit(task, input) {
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }
  task.text = text;
  editingTaskId = null;
  saveTasks();
  render();
}

addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    return;
  }
  tasks.unshift({ id: crypto.randomUUID(), text, isComplete: false, createdAt: new Date().toISOString() });
  saveTasks();
  render();
  taskInput.value = "";
  taskInput.focus();
});

document.querySelector(".filters").addEventListener("click", (event) => {
  const tab = event.target.closest("[data-filter]");
  if (!tab) return;
  currentFilter = tab.dataset.filter;
  document.querySelectorAll(".filter-tab").forEach((filterTab) => {
    filterTab.setAttribute("aria-selected", String(filterTab === tab));
  });
  render();
});

taskList.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const taskItem = actionButton.closest("[data-id]");
  const task = tasks.find((item) => item.id === taskItem.dataset.id);
  if (!task) return;

  if (actionButton.dataset.action === "edit") {
    editingTaskId = task.id;
    render();
    const editInput = taskList.querySelector(".edit-input");
    editInput.focus();
    editInput.select();
    return;
  }
  if (actionButton.dataset.action === "save-edit") {
    saveTaskEdit(task, taskItem.querySelector(".edit-input"));
    return;
  }
  if (actionButton.dataset.action === "cancel-edit") {
    editingTaskId = null;
    render();
    return;
  }
  if (actionButton.dataset.action === "toggle") task.isComplete = !task.isComplete;
  if (actionButton.dataset.action === "delete") {
    tasks = tasks.filter((item) => item.id !== task.id);
    if (editingTaskId === task.id) editingTaskId = null;
  }
  saveTasks();
  render();
});

taskList.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || !event.target.matches(".edit-input")) return;
  const taskItem = event.target.closest("[data-id]");
  const task = tasks.find((item) => item.id === taskItem.dataset.id);
  if (task) saveTaskEdit(task, event.target);
});

document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric", month: "long", day: "numeric", weekday: "short"
}).format(new Date());

render();