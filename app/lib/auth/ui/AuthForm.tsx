import { Form, Link } from "remix";
import { useSearchParams } from "react-router-dom";
import { TextField, Checkbox } from "~/lib/core/ui/FormField";
import { Button } from "~/lib/core/ui/Button";

type Props = {
  authType: "signup" | "login" | "request" | "confirm";
  loading?: boolean;
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

export const AuthForm = ({ authType, loading }: Props) => {
  const { button, url } = actionMap[authType];
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  return (
    <Form className="flex flex-col gap-5" method="post" action={url}>
      {authType === "confirm" && (
        <input type="hidden" name="token" value={token || ""} />
      )}
      {authType !== "confirm" && (
        <TextField
          id="email"
          name="email"
          type="email"
          placeholder="your@mail.com"
          label="Email"
        />
      )}
      {authType !== "request" && (
        <TextField
          id="password"
          name="password"
          type="password"
          placeholder="********"
          label="Password"
        />
      )}
      {authType === "login" && (
        <div className="flex items-center justify-between">
          <Checkbox id="rememberMe" name="rememberMe" label="Remember me" />
          <Link
            className="text-slate-500 text-sm"
            to="/auth/request-password-reset"
          >
            Forgot password
          </Link>
        </div>
      )}
      <Button className="w-full mt-2" type="submit" disabled={loading}>
        {button}
      </Button>
    </Form>
  );
};
