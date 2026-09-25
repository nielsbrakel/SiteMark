/** A success. Core returns these instead of throwing on user input (D-225). */
export type Ok<T> = { readonly ok: true; readonly value: T };
/** A failure with a typed error, usually an `ErrorCode` (src/core/errors.ts). */
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

/** The `default` branch of an exhaustive switch. Reaching it at runtime is a programming error. */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
