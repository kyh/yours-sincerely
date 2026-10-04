/**
 * The two kinds of procedure, so each contract line says which one it is. Both are
 * plain `oc`: they declare no errors, because a declared code marks every matching
 * refusal `defined`, which would change what the wire already carries.
 *
 * - `publicBase`: no session needed; `context.user` is still the caller's when they
 *   are signed in.
 * - `protectedBase`: needs a session. `@repo/service` implements it with
 *   `os.<router>.use(requireUser)`, on the implementer, where it runs before input
 *   validation: an anonymous call answers 401, never 400.
 */
export { oc as protectedBase, oc as publicBase } from "@orpc/contract";
