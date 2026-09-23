import assert from "node:assert/strict";
import test from "node:test";

import {
  requestPasswordResetInput,
  setPasswordFormInput,
  setPasswordInput,
  signInWithPasswordInput,
  signUpInput,
} from "./auth.ts";

const email = "writer@example.com";
const sevenChars = "1234567";
// 37 characters, 74 UTF-8 bytes: over the byte cap while well under 72 characters.
const seventyFourBytes = "é".repeat(37);

test("sign-up rejects a password shorter than 8 characters", () => {
  const result = signUpInput.safeParse({ email, password: sevenChars });

  assert.equal(result.success, false);
  assert.deepEqual(
    result.error?.issues.map((issue) => issue.message),
    ["Password must be at least 8 characters"],
  );
});

test("sign-up caps a password at 72 UTF-8 bytes, not 72 characters", () => {
  assert.equal(signUpInput.safeParse({ email, password: "a".repeat(72) }).success, true);
  assert.equal(signUpInput.safeParse({ email, password: "a".repeat(73) }).success, false);

  const result = signUpInput.safeParse({ email, password: seventyFourBytes });
  assert.equal(result.success, false);
  assert.deepEqual(
    result.error?.issues.map((issue) => issue.message),
    ["Password is too long"],
  );
});

test("sign-in accepts passwords that sign-up would reject", () => {
  for (const password of [sevenChars, seventyFourBytes, "a".repeat(100)]) {
    assert.equal(signInWithPasswordInput.safeParse({ email, password }).success, true, password);
  }
});

test("every schema rejects a malformed email", () => {
  for (const schema of [signUpInput, signInWithPasswordInput, requestPasswordResetInput]) {
    assert.equal(
      schema.safeParse({ email: "not-an-email", password: "a-long-password" }).success,
      false,
    );
  }
});

test("an email being stored is trimmed and lowercased", () => {
  const typed = { email: " MiXeD@Example.com ", password: "a-long-password" };

  assert.equal(signUpInput.parse(typed).email, "mixed@example.com");
});

test("an email being looked up is trimmed but keeps its case", () => {
  const typed = { email: " MiXeD@Example.com ", password: "a-long-password" };

  assert.equal(signInWithPasswordInput.parse(typed).email, "MiXeD@Example.com");
  assert.equal(requestPasswordResetInput.parse(typed).email, "MiXeD@Example.com");
});

test("a reset password follows the sign-up rule", () => {
  assert.equal(setPasswordInput.safeParse({ password: sevenChars, token: "t" }).success, false);
  assert.equal(
    setPasswordInput.safeParse({ password: seventyFourBytes, token: "t" }).success,
    false,
  );
  assert.equal(
    setPasswordInput.safeParse({ password: "a-new-password", token: "t" }).success,
    true,
  );
});

test("the set-password form reports a mismatch on the confirmation field", () => {
  const result = setPasswordFormInput.safeParse({
    confirmPassword: "a-new-passwort",
    password: "a-new-password",
  });

  assert.equal(result.success, false);
  assert.deepEqual(
    result.error?.issues.map((issue) => [issue.path, issue.message]),
    [[["confirmPassword"], "Passwords don't match"]],
  );
});

test("the set-password form reports a short password on the password field", () => {
  const result = setPasswordFormInput.safeParse({
    confirmPassword: sevenChars,
    password: sevenChars,
  });

  assert.equal(result.success, false);
  assert.deepEqual(
    result.error?.issues.map((issue) => issue.path),
    [["password"]],
  );
});
