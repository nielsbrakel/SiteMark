/** Thrown by typed stubs in a `test(T-xxx): red` commit (docs/testing.md#tdd-protocol). */
export class NotImplementedError extends Error {
  override name = 'NotImplementedError';
}

/** Body of a red-phase stub. The green commit replaces every call. */
export function notImplemented(): never {
  throw new NotImplementedError('Not implemented yet (TDD red phase)');
}
