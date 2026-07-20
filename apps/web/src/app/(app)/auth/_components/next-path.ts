/**
 * Where to send someone after they sign in or sign up.
 *
 * A `?next=` value is attacker-controllable, so only a same-origin absolute
 * path is honored. `//evil.example` is a protocol-relative URL that browsers
 * treat as another origin, which is why the second check exists. Repeated
 * params arrive as an array; there is no sensible single destination in that
 * case, so it falls back too.
 */
export const safeNextPath = (nextPath: string | string[] | undefined): string => {
  if (typeof nextPath !== "string") return "/";
  return nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
};
