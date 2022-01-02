import {
  Form,
  useLoaderData,
  useFormAction,
  useSubmit,
  useTransition,
} from "remix";
import { TextField } from "~/lib/core/ui/FormField";
import { Spinner } from "~/lib/core/ui/Spinner";
import { User } from "~/lib/user/data/userSchema";
import { isIOS } from "~/lib/core/util/platform";

type LoaderData = {
  user: User;
};

export const Profile = () => {
  const { user } = useLoaderData<LoaderData>();
  const submit = useSubmit();
  const transition = useTransition();

  const handleNameBlur = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    submit({ name: event.target.value }, { method: "post", replace: true });
  };

  return (
    <section className="sm:flex">
      <img
        className="m-auto sm:w-1/2"
        src="/assets/dancing.svg"
        alt="Not logged in"
        width={300}
        height={225}
      />
      <div className="sm:w-1/2">
        <Form method="post">
          <div className="relative">
            <TextField
              label="Your alias"
              id="name"
              name="name"
              className="text-2xl font-bold"
              defaultValue={user.name || ""}
              disabled={transition.state === "submitting"}
              onBlur={handleNameBlur}
            />
            <Spinner
              className="absolute right-2 top-9"
              loading={transition.state === "submitting"}
            />
          </div>
          {!isIOS() && (
            <button
              className="mt-10 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 rounded-md w-full justify-center transition text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto"
              type="submit"
              formAction={useFormAction("/auth/logout")}
              formMethod="post"
            >
              Logout
            </button>
          )}
        </Form>
      </div>
    </section>
  );
};
