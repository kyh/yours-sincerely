import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildResetUrl,
  createResetEmailSender,
  createResetToken,
  hashResetToken,
} from "./password-reset-core.ts";
import type { EmailClient } from "./password-reset-core.ts";

type SentMessage = Parameters<EmailClient["send"]>[0];

const recordingClient = (error: { message: string; name: string } | null = null) => {
  const sent: SentMessage[] = [];
  const emails: EmailClient = {
    send: (message) => {
      sent.push(message);
      return Promise.resolve({ error });
    },
  };
  return { emails, sent };
};

describe("reset token at rest", () => {
  it("stores a SHA-256 digest, never the token itself", () => {
    const resetToken = createResetToken();
    const digest = hashResetToken(resetToken);

    assert.match(digest, /^[0-9a-f]{64}$/u);
    assert.notEqual(digest, resetToken);
    assert.equal(hashResetToken(resetToken), digest, "redemption must find the same digest");
  });

  it("mints a fresh 256-bit token each time", () => {
    const resetToken = createResetToken();

    assert.match(resetToken, /^[0-9a-f]{64}$/u);
    assert.notEqual(createResetToken(), resetToken);
  });
});

describe("reset link", () => {
  it("points at the password-update page of the configured origin", () => {
    assert.equal(
      buildResetUrl("https://yourssincerely.org", "abc123"),
      "https://yourssincerely.org/auth/password-update?token=abc123",
    );
  });

  it("tolerates a trailing slash on the origin", () => {
    assert.equal(
      buildResetUrl("https://preview.example.com/", "abc123"),
      "https://preview.example.com/auth/password-update?token=abc123",
    );
  });
});

describe("reset email sender", () => {
  it("sends the link to the requested address", async () => {
    const { emails, sent } = recordingClient();
    const resetUrl = buildResetUrl("https://yourssincerely.org", "abc123");

    await createResetEmailSender(emails)({ resetUrl, to: "writer@example.com" });

    assert.equal(sent.length, 1);
    assert.equal(sent[0]?.to, "writer@example.com");
    assert.ok(sent[0]?.html.includes(resetUrl));
  });

  // Resend resolves with `{ error }` instead of throwing, so ignoring the result
  // tells the user "sent" for an email that never left.
  it("rejects when Resend refuses the email", async () => {
    const { emails } = recordingClient({
      message: "You have reached your daily email sending quota.",
      name: "daily_quota_exceeded",
    });

    await assert.rejects(
      createResetEmailSender(emails)({
        resetUrl: "https://yourssincerely.org/auth/password-update?token=abc123",
        to: "writer@example.com",
      }),
      /Resend daily_quota_exceeded: You have reached your daily email sending quota\./u,
    );
  });
});
