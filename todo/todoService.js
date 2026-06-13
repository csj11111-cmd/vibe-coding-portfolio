import { db } from "./firebase.js";
import {
  ref,
  push,
  set,
  get,
  onValue,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

const TODOS_PATH = "todos";

function todosRef() {
  return ref(db, TODOS_PATH);
}

function todoRef(id) {
  return ref(db, `${TODOS_PATH}/${id}`);
}

function parseTodos(snapshot) {
  const value = snapshot.val();
  if (!value) return [];

  return Object.entries(value)
    .map(([id, item]) => ({ id, ...item }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/** Firebase에서 할 일 목록을 한 번 가져오기 */
export async function getTodos() {
  const snapshot = await get(todosRef());
  return parseTodos(snapshot);
}

/** Firebase Realtime Database에 할 일 추가 */
export async function addTodo(data) {
  const newRef = push(todosRef());
  const todo = {
    title: data.title,
    date: data.date,
    time: data.time || "",
    category: data.category,
    priority: data.priority,
    description: data.description || "",
    done: false,
    createdAt: Date.now(),
  };

  await set(newRef, todo);
  return { id: newRef.key, ...todo };
}

export async function updateTodo(id, data) {
  await update(todoRef(id), {
    title: data.title,
    date: data.date,
    time: data.time || "",
    category: data.category,
    priority: data.priority,
    description: data.description || "",
  });
}

export async function deleteTodo(id) {
  await remove(todoRef(id));
}

export async function toggleTodoDone(id, done) {
  await update(todoRef(id), { done });
}

export async function deleteDoneTodos(ids) {
  await Promise.all(ids.map((id) => remove(todoRef(id))));
}

/** 실시간으로 할 일 목록 구독 (추가·수정·삭제 시 자동 반영) */
export function subscribeTodos(onData, onError) {
  return onValue(
    todosRef(),
    (snapshot) => {
      onData(parseTodos(snapshot));
    },
    onError
  );
}
