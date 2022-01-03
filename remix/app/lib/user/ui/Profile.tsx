import { Form, useLoaderData, useFormAction, useTransition } from "remix";
import { Button } from "~/lib/core/ui/Button";
import { TextField } from "~/lib/core/ui/FormField";
import { User } from "~/lib/user/data/userSchema";

type LoaderData = {
  user: User;
};

export const Profile = () => {
  const { user } = useLoaderData<LoaderData>();
  const transition = useTransition();

  return (
    <Form className="max-w-sm mx-auto flex flex-col gap-8" method="post">
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
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 rounded-md justify-center transition text-red-700 hover:bg-red-50 dark:text-red-500 dark:hover:bg-transparent dark:hover:text-red-300"
          type="submit"
          formAction={useFormAction("/auth/logout")}
          formMethod="post"
        >
          Logout
        </button>
      </div>
    </Form>
  );
};
