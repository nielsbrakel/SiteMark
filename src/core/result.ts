import { notImplemented } from './not-implemented';

/** A success. Core returns these instead of throwing on user input (D-225). */
export type Ok<T> = { readonly ok: true; readonly value: T };
/** A failure with a typed error, usually an `ErrorCode` (src/core/errors.ts). */
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(_value: T): Ok<T> {
  return notImplemented();
}

export function err<E>(_error: E): Err<E> {
  return notImplemented();
}

/** The `default` branch of an exhaustive switch. Reaching it at runtime is a programming error. */
export function assertNever(_value: never): never {
  return notImplemented();
}
