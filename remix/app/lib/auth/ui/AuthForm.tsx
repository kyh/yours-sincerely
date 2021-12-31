import { Form, Link } from "remix";
import { TextField, Checkbox } from "~/lib/core/ui/FormField";
import { Button } from "~/lib/core/ui/Button";
import { AuthInput } from "~/lib/auth/data/authSchema";

type Props = {
  authType: "signup" | "login" | "request" | "confirm";
  submitButtonText: React.ReactNode;
};

export const AuthForm = ({ authType, submitButtonText }: Props) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const input = Object.fromEntries(data.entries()) as AuthInput;
    console.log(input);
  };

  return (
    <Form className="flex flex-col gap-5" onSubmit={handleSubmit}>
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
          <Checkbox id="remember-me" name="remember-me" label="Remember me" />
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
