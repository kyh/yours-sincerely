import { Form, useTransition } from "remix";
import { useSearchParams } from "react-router-dom";
import { Button } from "~/lib/core/ui/Button";
import { TextField } from "~/lib/core/ui/FormField";
import { User } from "~/lib/user/data/userSchema";

type Props = {
  user: User;
};

export const EditProfile = ({ user }: Props) => {
  const transition = useTransition();
  const [searchParams] = useSearchParams();
  const fromPath = searchParams.get("fromPath");

  return (
    <Form
      className="flex flex-col max-w-sm gap-8 mx-auto"
      action={`/${user.id}/edit`}
      method="post"
    >
      {fromPath && <input type="hidden" name="fromPath" value={fromPath} />}
      <TextField
        label="Your signature"
        id="displayName"
        name="displayName"
        className="text-2xl font-bold"
        defaultValue={user.displayName || ""}
        placeholder="Anonymous"
      />
      <TextField
        label="Email"
        id="email"
        name="email"
        className="text-2xl font-bold"
        placeholder="your@mail.com"
        defaultValue={user.email || ""}
      />
      <div className="flex items-center justify-between">
        <Button type="submit" disabled={transition.state === "submitting"}>
          Save Changes
        </Button>
      </div>
    </Form>
  );
};
