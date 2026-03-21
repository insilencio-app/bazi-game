import { afterEach, beforeEach, vi } from 'vitest';

const ensureLocalStorage = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const candidate = window.localStorage as Partial<Storage> | undefined;
  const hasUsableStorage =
    candidate &&
    typeof candidate.getItem === 'function' &&
    typeof candidate.setItem === 'function' &&
    typeof candidate.removeItem === 'function' &&
    typeof candidate.clear === 'function';

  if (hasUsableStorage) {
    return;
  }

  const store = new Map<string, string>();
  const mockStorage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  });
};

beforeEach(() => {
  ensureLocalStorage();
  window.localStorage.clear();
  vi.useRealTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});
