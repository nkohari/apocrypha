export type ArrayOrHash<T> = T[] | Record<string, T>;

export function arrayifyParameter<T>(param: Maybe<ArrayOrHash<T>>) {
  if (!param) return [];
  if (Array.isArray(param)) return param;
  return Object.values(param) as T[];
}
