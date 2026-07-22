/**
 * Origin used only to resolve a candidate redirect against. `.invalid` is
 * reserved by RFC 2606, so it can never collide with a real deployment origin.
 */
const GUARD_ORIGIN = "http://next-path.invalid";

const isSameOrigin = (candidate: string): boolean => {
  try {
    return new URL(candidate, GUARD_ORIGIN).origin === GUARD_ORIGIN;
  } catch {
    return false;
  }
};

/**
 * Where to send someone after they sign in or sign up.
 *
 * A `?next=` value is attacker-controllable and nothing in the app ever
 * produces one, so every input this sees is externally crafted. Prefix checks
 * are not enough: for special schemes the WHATWG URL parser treats `\` as `/`,
 * so `/\evil.example` resolves to `http://evil.example/`. The only reliable
 * test is to resolve the value the same way the client router does and compare
 * origins.
 *
 * The second check is not redundant. A path can *normalise into* a
 * protocol-relative URL — `/.//evil.example` resolves same-origin but its
 * pathname is `//evil.example`, which the router would then re-resolve
 * cross-origin. So the string actually handed to the router is re-checked.
 *
 * Repeated params arrive as an array; there is no sensible single destination
 * in that case, so it falls back too.
 */
export const safeNextPath = (nextPath: string | string[] | undefined): string => {
  if (typeof nextPath !== "string") return "/";

  let resolved: string;
  try {
    const url = new URL(nextPath, GUARD_ORIGIN);
    if (url.origin !== GUARD_ORIGIN) return "/";
    resolved = `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }

  return isSameOrigin(resolved) ? resolved : "/";
};
