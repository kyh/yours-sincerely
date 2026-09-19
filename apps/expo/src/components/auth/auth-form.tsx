import { useRef, useState } from "react";
import { View } from "react-native";
import type { TextInput } from "react-native";
import { usePathname, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { signInWithPasswordInput, signUpInput } from "@repo/contracts/auth";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/form-field";
import { useReleasePushIdentity } from "@/components/notifications/push-notification-registration";
import { orpc } from "@/lib/api";
import { resetAfterSessionChanged } from "@/lib/query-policies";
import { isTabHref, useTabNavigation } from "@/lib/use-tab-navigation";

/** Port of the web auth-form — email + password sign in/up. The session
    cookie from the response is captured by the fetch wrapper. */
interface Props {
  type: "signin" | "signup";
  /** Where to land after a successful sign-in/sign-up. Mirrors the web
      form's `nextPath` redirect target. */
  next?: Href;
}

type FieldErrors = Partial<Record<"email" | "password", string>>;

const showMutationError = (mutationError: { message: string }) =>
  toast.error(mutationError.message);
const signInFormInput = signInWithPasswordInput.extend({
  password: signInWithPasswordInput.shape.password.min(1, "Password is required"),
});

export const AuthForm = ({ type, next = "/" }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const navigateToTab = useTabNavigation();
  const releasePushIdentity = useReleasePushIdentity();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const emailInput = useRef<TextInput>(null);
  const passwordInput = useRef<TextInput>(null);

  const onSuccess = async () => {
    if (type === "signin") {
      await releasePushIdentity();
    }
    await resetAfterSessionChanged();
    if (next !== pathname) {
      if (isTabHref(next)) {
        navigateToTab(next);
      } else {
        router.replace(next);
      }
    }
  };
  const signIn = useMutation(
    orpc.auth.signInWithPassword.mutationOptions({ onError: showMutationError, onSuccess }),
  );
  const signUp = useMutation(
    orpc.auth.signUp.mutationOptions({ onError: showMutationError, onSuccess }),
  );

  const handleSubmit = () => {
    if (signIn.isPending || signUp.isPending) {
      return;
    }
    setSubmitted(true);
    const schema = type === "signup" ? signUpInput : signInFormInput;
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const [field] = issue.path;
        if (field === "email" && errors.email === undefined) {
          errors.email = issue.message;
        } else if (field === "password" && errors.password === undefined) {
          errors.password = issue.message;
        }
      }
      setFieldErrors(errors);
      if (errors.email === undefined) {
        passwordInput.current?.focus();
      } else {
        emailInput.current?.focus();
      }
      return;
    }
    setFieldErrors({});
    if (type === "signup") {
      signUp.mutate(parsed.data);
    } else {
      signIn.mutate(parsed.data);
    }
  };

  return (
    <View className="gap-5">
      <View>
        <FormField
          inputRef={emailInput}
          label="Email"
          error={fieldErrors.email}
          position="first"
          testID="email-input"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (submitted) {
              const parsed = signInWithPasswordInput.shape.email.safeParse(value);
              setFieldErrors((errors) => ({
                ...errors,
                email: parsed.success ? undefined : parsed.error.issues[0]?.message,
              }));
            }
          }}
          placeholder="name@example.com"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordInput.current?.focus()}
        />
        <FormField
          inputRef={passwordInput}
          label="Password"
          error={fieldErrors.password}
          position="last"
          testID="password-input"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (submitted) {
              const schema = type === "signup" ? signUpInput : signInFormInput;
              const parsed = schema.shape.password.safeParse(value);
              setFieldErrors((errors) => ({
                ...errors,
                password: parsed.success ? undefined : parsed.error.issues[0]?.message,
              }));
            }
          }}
          placeholder="******"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={type === "signup" ? "new-password" : "current-password"}
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          secureTextEntry
        />
      </View>
      <Button onPress={handleSubmit} loading={signIn.isPending || signUp.isPending}>
        {type === "signin" ? "Login" : "Sign Up"}
      </Button>
    </View>
  );
};
