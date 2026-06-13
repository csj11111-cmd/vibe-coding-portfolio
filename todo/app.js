import {
  getTodos,
  addTodo,
  updateTodo,
  deleteTodo,
  toggleTodoDone,
  deleteDoneTodos,
  subscribeTodos,
} from "./todoService.js";

const CATEGORY_LABELS = {
  work: "업무",
  personal: "개인",
  study: "학습",
  health: "건강",
  other: "기타",
};

const PRIORITY_LABELS = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const $ = (id) => document.getElementById(id);

const form = $("scheduleForm");
const editIdInput = $("editId");
const titleInput = $("title");
const dateInput = $("date");
const timeInput = $("time");
const categoryInput = $("category");
const priorityInput = $("priority");
const descriptionInput = $("description");
const submitBtn = $("submitBtn");
const cancelEditBtn = $("cancelEditBtn");
const scheduleList = $("scheduleList");
const emptyState = $("emptyState");
const loadingState = $("loadingState");
const searchInput = $("searchInput");
const filterStatus = $("filterStatus");
const filterCategory = $("filterCategory");
const sortBy = $("sortBy");
const clearDoneBtn = $("clearDoneBtn");
const statTotal = $("statTotal");
const statPending = $("statPending");
const statDone = $("statDone");
const toast = $("toast");
const confirmDialog = $("confirmDialog");
const confirmMessage = $("confirmMessage");
const confirmCancel = $("confirmCancel");
const permissionBanner = $("permissionBanner");

let schedules = [];
let toastTimer = null;
let isSubmitting = false;
let isLoading = true;

function setLoading(loading) {
  isLoading = loading;
  loadingState.hidden = !loading;
  scheduleList.hidden = loading || schedules.length === 0;
  emptyState.hidden = loading || schedules.length > 0;
}

function isPermissionDenied(error) {
  const code = error?.code || "";
  const message = error?.message || "";
  return code === "PERMISSION_DENIED" || message.includes("Permission denied");
}

function showPermissionBanner(show) {
  permissionBanner.hidden = !show;
}

function handleFirebaseError(error) {
  if (isPermissionDenied(error)) {
    showPermissionBanner(true);
  }
  return formatFirebaseError(error);
}

async function initApp() {
  setLoading(true);

  try {
    schedules = await getTodos();
    showPermissionBanner(false);
    render();
  } catch (error) {
    console.error("할 일 목록 불러오기 실패:", error);
    handleFirebaseError(error);
    showToast(formatFirebaseError(error) || "할 일 목록을 불러오지 못했습니다.");
  }

  subscribeTodos(
    (todos) => {
      schedules = todos;
      setLoading(false);
      showPermissionBanner(false);
      render();
    },
    (error) => {
      console.error("Firebase 연결 오류:", error);
      setLoading(false);
      handleFirebaseError(error);
      showToast(formatFirebaseError(error) || "Firebase 연결에 실패했습니다.");
      render();
    }
  );
}

function todayString() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add("toast--visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("toast--visible");
    setTimeout(() => {
      toast.hidden = true;
    }, 300);
  }, 2500);
}

function confirmAction(message) {
  return new Promise((resolve) => {
    confirmMessage.textContent = message;
    confirmDialog.showModal();

    const onOk = () => {
      cleanup();
      resolve(true);
    };
    const onCancel = () => {
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      confirmDialog.close();
      confirmDialog.removeEventListener("close", onOk);
      confirmCancel.removeEventListener("click", onCancel);
    };

    confirmDialog.addEventListener("close", onOk);
    confirmCancel.addEventListener("click", onCancel);
  });
}

function resetForm() {
  form.reset();
  editIdInput.value = "";
  dateInput.value = todayString();
  submitBtn.textContent = "추가하기";
  cancelEditBtn.hidden = true;
}

function startEdit(id) {
  const item = schedules.find((s) => s.id === id);
  if (!item) return;

  editIdInput.value = item.id;
  titleInput.value = item.title;
  dateInput.value = item.date;
  timeInput.value = item.time || "";
  categoryInput.value = item.category;
  priorityInput.value = item.priority;
  descriptionInput.value = item.description || "";
  submitBtn.textContent = "수정하기";
  cancelEditBtn.hidden = false;
  titleInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${y}.${m}.${d} (${weekday})`;
}

function isOverdue(item) {
  if (item.done) return false;
  const today = todayString();
  if (item.date < today) return true;
  if (item.date === today && item.time) {
    const now = new Date();
    const [h, min] = item.time.split(":").map(Number);
    const scheduleTime = new Date();
    scheduleTime.setHours(h, min, 0, 0);
    return now > scheduleTime;
  }
  return false;
}

function getFilteredSchedules() {
  const queryText = searchInput.value.trim().toLowerCase();
  const status = filterStatus.value;
  const category = filterCategory.value;
  const sort = sortBy.value;

  let result = schedules.filter((item) => {
    if (status === "pending" && item.done) return false;
    if (status === "done" && !item.done) return false;
    if (category !== "all" && item.category !== category) return false;
    if (queryText) {
      const haystack = [
        item.title,
        item.description,
        CATEGORY_LABELS[item.category],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(queryText)) return false;
    }
    return true;
  });

  result.sort((a, b) => {
    if (sort === "date-asc") {
      const cmp = a.date.localeCompare(b.date);
      if (cmp !== 0) return cmp;
      return (a.time || "").localeCompare(b.time || "");
    }
    if (sort === "date-desc") {
      const cmp = b.date.localeCompare(a.date);
      if (cmp !== 0) return cmp;
      return (b.time || "").localeCompare(a.time || "");
    }
    if (sort === "priority") {
      const diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (diff !== 0) return diff;
      return a.date.localeCompare(b.date);
    }
    if (sort === "title") {
      return a.title.localeCompare(b.title, "ko");
    }
    return 0;
  });

  return result;
}

function updateStats() {
  statTotal.textContent = schedules.length;
  statPending.textContent = schedules.filter((s) => !s.done).length;
  statDone.textContent = schedules.filter((s) => s.done).length;
}

function renderScheduleItem(item) {
  const li = document.createElement("li");
  const overdue = isOverdue(item);
  li.className =
    "schedule-item" +
    (item.done ? " schedule-item--done" : "") +
    (overdue ? " schedule-item--overdue" : "");
  li.dataset.id = item.id;

  const timeLabel = item.time ? item.time : "종일";

  li.innerHTML = `
    <input
      type="checkbox"
      class="schedule-item__check"
      ${item.done ? "checked" : ""}
      aria-label="${item.title} 완료 처리"
    />
    <div class="schedule-item__body">
      <div class="schedule-item__title">${escapeHtml(item.title)}</div>
      <div class="schedule-item__meta">
        <span>📆 ${formatDate(item.date)}</span>
        <span>🕐 ${timeLabel}</span>
      </div>
      ${item.description ? `<p class="schedule-item__desc">${escapeHtml(item.description)}</p>` : ""}
      <div class="schedule-item__badges">
        <span class="badge badge--${item.category}">${CATEGORY_LABELS[item.category]}</span>
        <span class="badge badge--priority-${item.priority}">${PRIORITY_LABELS[item.priority]}</span>
        ${overdue ? '<span class="badge badge--overdue">지연</span>' : ""}
      </div>
    </div>
    <div class="schedule-item__actions">
      <button type="button" class="btn btn--icon" data-action="edit" aria-label="수정">✏️</button>
      <button type="button" class="btn btn--icon btn--danger-icon" data-action="delete" aria-label="삭제">🗑️</button>
    </div>
  `;

  li.querySelector(".schedule-item__check").addEventListener("change", (e) => {
    toggleDone(item.id, e.target.checked);
  });

  li.querySelector('[data-action="edit"]').addEventListener("click", () => startEdit(item.id));
  li.querySelector('[data-action="delete"]').addEventListener("click", () => deleteSchedule(item.id));

  return li;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function render() {
  const filtered = getFilteredSchedules();
  scheduleList.innerHTML = "";

  filtered.forEach((item) => {
    scheduleList.appendChild(renderScheduleItem(item));
  });

  if (!isLoading) {
    emptyState.hidden = filtered.length > 0;
    scheduleList.hidden = filtered.length === 0;
  }

  updateStats();
}

function setSubmitting(loading) {
  isSubmitting = loading;
  submitBtn.disabled = loading;
  submitBtn.textContent = loading
    ? "저장 중..."
    : editIdInput.value
      ? "수정하기"
      : "추가하기";
}

function formatFirebaseError(error) {
  const code = error?.code || "";
  const message = error?.message || "";

  if (code === "PERMISSION_DENIED" || message.includes("Permission denied")) {
    return "Firebase 권한이 없습니다. Realtime Database 규칙을 확인해 주세요.";
  }
  if (code === "NETWORK_ERROR" || message.includes("network")) {
    return "네트워크 오류입니다. 인터넷 연결을 확인해 주세요.";
  }
  return "할 일 추가에 실패했습니다.";
}

async function addSchedule(data) {
  try {
    setSubmitting(true);
    await addTodo(data);
    showToast("할 일이 추가되었습니다.");
  } catch (error) {
    console.error("할 일 추가 실패:", error);
    handleFirebaseError(error);
    showToast(formatFirebaseError(error));
  } finally {
    setSubmitting(false);
  }
}

async function updateSchedule(id, data) {
  try {
    setSubmitting(true);
    await updateTodo(id, data);
    showToast("스케줄이 수정되었습니다.");
  } catch (error) {
    console.error(error);
    showToast("스케줄 수정에 실패했습니다.");
  } finally {
    setSubmitting(false);
  }
}

async function deleteSchedule(id) {
  const item = schedules.find((s) => s.id === id);
  if (!item) return;

  const ok = await confirmAction(`"${item.title}" 일정을 삭제할까요?`);
  if (!ok) return;

  try {
    await deleteTodo(id);
    showToast("스케줄이 삭제되었습니다.");
    if (editIdInput.value === id) resetForm();
  } catch (error) {
    console.error(error);
    showToast("스케줄 삭제에 실패했습니다.");
  }
}

async function toggleDone(id, done) {
  try {
    await toggleTodoDone(id, done);
    showToast(done ? "완료 처리되었습니다." : "예정으로 되돌렸습니다.");
  } catch (error) {
    console.error(error);
    showToast("상태 변경에 실패했습니다.");
  }
}

async function clearDoneSchedules() {
  const doneItems = schedules.filter((s) => s.done);
  if (doneItems.length === 0) {
    showToast("완료된 항목이 없습니다.");
    return;
  }

  const ok = await confirmAction(`완료된 ${doneItems.length}개 항목을 모두 삭제할까요?`);
  if (!ok) return;

  try {
    await deleteDoneTodos(doneItems.map((item) => item.id));
    showToast("완료 항목이 삭제되었습니다.");
  } catch (error) {
    console.error(error);
    showToast("완료 항목 삭제에 실패했습니다.");
  }
}

function getFormData() {
  return {
    title: titleInput.value.trim(),
    date: dateInput.value,
    time: timeInput.value,
    category: categoryInput.value,
    priority: priorityInput.value,
    description: descriptionInput.value.trim(),
  };
}

function validateForm(data) {
  if (!data.title) {
    showToast("제목을 입력해 주세요.");
    titleInput.focus();
    return false;
  }
  if (!data.date) {
    showToast("날짜를 선택해 주세요.");
    dateInput.focus();
    return false;
  }
  return true;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isSubmitting) return;

  const data = getFormData();
  if (!validateForm(data)) return;

  const editId = editIdInput.value;
  if (editId) {
    await updateSchedule(editId, data);
  } else {
    await addSchedule(data);
  }
  resetForm();
});

cancelEditBtn.addEventListener("click", resetForm);
clearDoneBtn.addEventListener("click", clearDoneSchedules);

[searchInput, filterStatus, filterCategory, sortBy].forEach((el) => {
  el.addEventListener("input", render);
  el.addEventListener("change", render);
});

dateInput.value = todayString();
initApp();
