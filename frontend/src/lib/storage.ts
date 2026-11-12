/** Browser storage is optional (private mode, quotas and corrupt data). */
export function readStorage(key: string): unknown {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the current session usable when browser persistence is unavailable.
  }
}
