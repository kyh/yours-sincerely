import { useEffect } from "react";
import {
  Form,
  Link,
  useActionData,
  useTransition,
  useSearchParams,
} from "remix";
import { useToast } from "~/lib/core/ui/Toaster";
import { TextField, Checkbox } from "~/lib/core/ui/FormField";
import { Button } from "~/lib/core/ui/Button";

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
  const transition = useTransition();
  const action = useActionData();
  const [searchParams] = useSearchParams();
  const { button, url } = actionMap[authType];

  const token = searchParams.get("token");
  const redirectTo = searchParams.get("redirectTo");

  useEffect(() => {
    if (action && action.message) {
      toast(action.message);
    }
  }, [action]);

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
        className="w-full mt-2"
        type="submit"
        disabled={transition.state !== "idle"}
      >
        {button}
      </Button>
    </Form>
  );
};
