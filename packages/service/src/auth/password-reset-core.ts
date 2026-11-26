import { createHash, randomBytes } from "node:crypto";

/**
 * The pure half of the password-reset link: token, digest, URL and the email
 * sender, with the email client as a parameter so `password-reset-core.test.ts`
 * can drive a failed send without a network. `password-reset.ts` stores it.
 */

export const RESET_TOKEN_EXPIRY_HOURS = 1;

export const createResetToken = () => randomBytes(32).toString("hex");

/**
 * The Token table stores only this digest, so a read of it (a backup, a
 * dashboard) yields no working link. Unsalted SHA-256 is enough: the token is
 * 256 random bits, so there is nothing to guess.
 */
export const hashResetToken = (resetToken: string) =>
  createHash("sha256").update(resetToken).digest("hex");

/** One HTTPS link serves every client. Associated domains open the installed
    app; browsers remain the universal fallback. */
export const buildResetUrl = (appUrl: string, resetToken: string) => {
  const resetUrl = new URL("/auth/password-update", appUrl);
  resetUrl.searchParams.set("token", resetToken);

  return resetUrl.toString();
};

export interface ResetEmail {
  to: string;
  resetUrl: string;
}

/** Resolves once the email is accepted for delivery; rejects otherwise. */
export type SendResetEmail = (email: ResetEmail) => Promise<void> | void;

/** The slice of Resend's `emails` client this uses. */
export interface EmailClient {
  send: (message: {
    from: string;
    html: string;
    subject: string;
    to: string;
  }) => Promise<{ error: { message: string; name: string } | null }>;
}

/**
 * Resend never throws: a spent quota, a revoked key and an outage all come back
 * as `error`, and the SDK logs nothing in production. Throwing is what turns
 * that into a logged failure instead of a "sent" toast for an email that never
 * left.
 */
export const createResetEmailSender: (
  emails: EmailClient,
) => (email: ResetEmail) => Promise<void> =
  (emails) =>
  async ({ resetUrl, to }) => {
    const { error } = await emails.send({
      from: "Yours Sincerely <noreply@yourssincerely.org>",
      html: `<p>Click the link below to reset your password. This link expires in ${RESET_TOKEN_EXPIRY_HOURS} hour.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
      subject: "Reset your password",
      to,
    });

    if (error !== null) {
      throw new Error(`Resend ${error.name}: ${error.message}`);
    }
  };

export type ResetEmailMode =
  | { readonly kind: "resend"; readonly apiKey: string }
  | { readonly kind: "log" }
  | { readonly kind: "off" };

/**
 * Resend when a key is set. Without one, the server's log outside production,
 * so local dev and tests can follow a reset, and nothing in production, where
 * a logged link is a live login to whoever reads the logs.
 */
export const resetEmailModeOf = (apiKey: string | undefined, production: boolean) => {
  if (apiKey !== undefined) {
    return { apiKey, kind: "resend" } satisfies ResetEmailMode;
  }

  return (production ? { kind: "off" } : { kind: "log" }) satisfies ResetEmailMode;
};

/** For the boot log: what an operator must know about the mode, if anything. */
export const resetEmailWarningOf = (mode: ResetEmailMode) =>
  mode.kind === "off"
    ? "This deployment sends no email: RESEND_API_KEY is unset, so a password reset is refused."
    : null;

/** The log half of the reset email: the link, written where the dev server shows it. */
export const createResetLogSender: (write: (line: string) => void) => SendResetEmail =
  (write) =>
  ({ resetUrl, to }) => {
    write(`[reset-email] not sent (no RESEND_API_KEY), logged here: to ${to}: ${resetUrl}`);
  };
