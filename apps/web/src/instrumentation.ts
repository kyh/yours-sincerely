export const register = async () => {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { RESET_EMAIL_WARNING } = await import("@repo/service/env");

  if (RESET_EMAIL_WARNING !== null) {
    console.warn(`[auth] ${RESET_EMAIL_WARNING}`);
  }
};
