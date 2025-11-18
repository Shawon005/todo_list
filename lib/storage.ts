export const STORAGE_KEYS = {
  USER: "dreamy-todo-user",
  TODOS: "dreamy-todo-items",
} as const;

export function readFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Unable to parse storage key: ${key}`, error);
    return fallback;
  }
}

export function writeToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(
      new CustomEvent("dreamy-storage-update", { detail: { key } }),
    );
  } catch (error) {
    console.warn(`Unable to write storage key: ${key}`, error);
  }
}

