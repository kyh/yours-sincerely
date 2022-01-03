import { Form, useLoaderData, useFormAction, useTransition } from "remix";
import { useSearchParams } from "react-router-dom";
import { Button } from "~/lib/core/ui/Button";
import { TextField } from "~/lib/core/ui/FormField";
import { User } from "~/lib/user/data/userSchema";

type LoaderData = {
  user: User;
};

export const Profile = () => {
  const { user } = useLoaderData<LoaderData>();
  const transition = useTransition();
  const [searchParams] = useSearchParams();
  const fromPath = searchParams.get("fromPath") || "/";

  return (
    <Form
      className="flex flex-col max-w-sm gap-8 mx-auto"
      action={`/profile?fromPath=${fromPath}`}
      method="post"
    >
      <TextField
        label="Your alias"
        id="name"
        name="name"
        className="text-2xl font-bold"
        defaultValue={user.name || ""}
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
        <button
          className="inline-flex items-center justify-center px-3 py-2 text-sm leading-4 text-red-700 transition border border-transparent rounded-md hover:bg-red-50 dark:text-red-500 dark:hover:bg-transparent dark:hover:text-red-300"
          type="submit"
          formAction={useFormAction("/auth/logout")}
          formMethod="post"
          disabled={transition.state === "submitting"}
        >
          Logout
        </button>
      </div>
    </Form>
  );
};
