export const shuffleArray = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

type QuizHistoryState = {
  cursor: number;
  seen: Record<string, number>;
};

const getStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return window.localStorage;
};

const loadHistoryState = (historyKey: string): QuizHistoryState => {
  const storage = getStorage();
  if (!storage) {
    return { cursor: 0, seen: {} };
  }

  try {
    const raw = storage.getItem(historyKey);
    if (!raw) {
      return { cursor: 0, seen: {} };
    }

    const parsed = JSON.parse(raw) as QuizHistoryState;
    if (typeof parsed?.cursor !== 'number' || typeof parsed?.seen !== 'object' || parsed.seen === null) {
      return { cursor: 0, seen: {} };
    }

    return parsed;
  } catch {
    return { cursor: 0, seen: {} };
  }
};

const saveHistoryState = (historyKey: string, state: QuizHistoryState) => {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(historyKey, JSON.stringify(state));
  } catch {
    // Ignore storage quota or serialization errors.
  }
};

const rankByNovelty = <T,>(
  items: T[],
  getKey: (item: T) => string,
  state: QuizHistoryState,
  minGap: number
): T[] => {
  const randomTie = new Map<string, number>();

  const freshnessScore = (item: T) => {
    const key = getKey(item);
    const seenAt = state.seen[key];
    const unseen = seenAt === undefined;
    const distance = unseen ? Number.POSITIVE_INFINITY : state.cursor - seenAt;

    if (!randomTie.has(key)) {
      randomTie.set(key, Math.random());
    }

    return {
      key,
      unseen,
      seenAt: seenAt ?? Number.NEGATIVE_INFINITY,
      isFresh: unseen || distance >= minGap,
      tie: randomTie.get(key) ?? 0,
    };
  };

  const annotated = items.map((item) => ({ item, score: freshnessScore(item) }));
  const fresh = annotated.filter((entry) => entry.score.isFresh);
  const stale = annotated.filter((entry) => !entry.score.isFresh);

  const sortFn = (
    a: { score: { unseen: boolean; seenAt: number; tie: number } },
    b: { score: { unseen: boolean; seenAt: number; tie: number } }
  ) => {
    if (a.score.unseen !== b.score.unseen) {
      return a.score.unseen ? -1 : 1;
    }

    if (a.score.seenAt !== b.score.seenAt) {
      return a.score.seenAt - b.score.seenAt;
    }

    return a.score.tie - b.score.tie;
  };

  const orderedFresh = [...fresh].sort(sortFn).map((entry) => entry.item);
  const orderedStale = [...stale].sort(sortFn).map((entry) => entry.item);

  return [...orderedFresh, ...orderedStale];
};

export const selectByNovelty = <T,>(
  items: T[],
  count: number,
  getKey: (item: T) => string,
  historyKey: string,
  minGap = 12
): T[] => {
  if (count <= 0 || items.length === 0) return [];

  const state = loadHistoryState(historyKey);
  const ranked = rankByNovelty(items, getKey, state, minGap);
  const selected = ranked.slice(0, Math.min(count, ranked.length));

  selected.forEach((item) => {
    state.cursor += 1;
    state.seen[getKey(item)] = state.cursor;
  });

  saveHistoryState(historyKey, state);
  return selected;
};
