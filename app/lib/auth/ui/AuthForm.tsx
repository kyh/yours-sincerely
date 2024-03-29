import {
  Form,
  Link,
  useActionData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { useEffect } from "react";
import { Button } from "~/components/Button";
import { Checkbox, TextField } from "~/components/FormField";
import { useToast } from "~/components/Toaster";

type Props = {
  authType: "signup" | "login" | "request" | "confirm";
};

const actionMap: Record<Props["authType"], { button: string; url: string }> = {
  signup: {
    url: "/auth/signup",
    button: "Sign up",
  },
  login: {
    url: "/auth/login",
    button: "Log in",
  },
  request: {
    url: "/auth/request-password-reset",
    button: "Request password reset",
  },
  confirm: {
    url: "/auth/confirm-password-reset",
    button: "Confirm password",
  },
};

export const AuthForm = ({ authType }: Props) => {
  const { toast } = useToast();
  const navigation = useNavigation();
  const action = useActionData();
  const [searchParams] = useSearchParams();
  const { button, url } = actionMap[authType];

  const token = searchParams.get("token");
  const redirectTo = searchParams.get("redirectTo");

  useEffect(() => {
    if (action && action.message) {
      toast(action.message);
    }
  }, [toast, action]);

  return (
    <Form className="flex flex-col gap-5" method="post" action={url}>
      <input type="hidden" name="redirectTo" value={redirectTo || "/"} />
      <input type="hidden" name="token" value={token || ""} />
      {authType !== "confirm" && (
        <TextField
          id="email"
          name="email"
          type="email"
          placeholder="your@mail.com"
          label="Email"
          required
        />
      )}
      {authType !== "request" && (
        <TextField
          id="password"
          name="password"
          type="password"
          placeholder="********"
          label="Password"
          required
        />
      )}
      {authType === "login" && (
        <div className="flex items-center justify-between">
          <Checkbox id="rememberMe" name="rememberMe" label="Remember me" />
          <Link
            className="text-sm text-slate-500 dark:text-slate-300"
            to="/auth/request-password-reset"
          >
            Forgot password
          </Link>
        </div>
      )}
      <Button
        className="mt-2 w-full"
        type="submit"
        loading={navigation.state !== "idle"}
      >
        {button}
      </Button>
    </Form>
  );
};
