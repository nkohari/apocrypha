/** Either an array or a hash of values of a single type */
export type ArrayOrHash<T> = T[] | Record<string, T>;

/** A value that may or may not be set, but definitely cannot be null. */
export type Maybe<T> = NonNullable<T> | undefined;

/** A function which evaluates a value and returns a Boolean result. */
export type Predicate<T> = (value: T) => boolean;

/** Either a value, or a promise for a future value */
export type MaybePromise<T> = T | Promise<T>;

export type VitePluginMode = 'build' | 'serve';
