const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const apiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '/api');

export const useRemoteQuizApi = parseBoolean(
  import.meta.env.VITE_USE_REMOTE_QUIZ_API,
  Boolean(import.meta.env.PROD)
);
