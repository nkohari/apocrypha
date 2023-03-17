/** A value that may or may not be set, but definitely cannot be null. */
type Maybe<T> = NonNullable<T> | undefined;
