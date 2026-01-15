export type JsonValue = unknown;

export const getItem = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const setItem = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
};

export const removeItem = (key: string): void => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    return;
  }
};

export const getJson = <T = JsonValue>(key: string): T | null => {
  const raw = getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const setJson = (key: string, value: JsonValue): void => {
  try {
    setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
};
