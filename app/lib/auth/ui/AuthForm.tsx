import { Form, Link } from "remix";
import { TextField, Checkbox } from "~/lib/core/ui/FormField";
import { Button } from "~/lib/core/ui/Button";

type Props = {
  authType: "signup" | "login" | "request" | "confirm";
  submitButtonText: React.ReactNode;
};

const actionMap: Record<Props["authType"], string> = {
  signup: "/auth/signup",
  login: "/auth/login",
  request: "/auth/request-password-reset",
  confirm: "/auth/confirm-password-reset",
};

export const AuthForm = ({ authType, submitButtonText }: Props) => {
  return (
    <Form
      className="flex flex-col gap-5"
      method="post"
      action={actionMap[authType]}
    >
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
      <Button className="w-full mt-2" type="submit">
        {submitButtonText}
      </Button>
    </Form>
  );
};
