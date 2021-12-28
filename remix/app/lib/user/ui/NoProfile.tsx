import { Link, Form } from "remix";
import { isIOS } from "~/lib/core/util/platform";

export const NoProfile = () => {
  return (
    <>
      <section className="flex">
        <img
          src="/assets/dancing.svg"
          alt="Not logged in"
          width={300}
          height={225}
        />
        <div className="flex-auto">
          {isIOS() ? (
            <>
              <h1 className="text-3xl font-bold my-5">No account required</h1>
              <p>
                Just <Link to="/new">make a post</Link> to get started
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold my-5">
                You’re not signed in...
              </h1>
              <p>
                But, you can still <Link to="/new">make a post</Link>{" "}
                anonymously without an account
              </p>
            </>
          )}
        </div>
      </section>
      {!isIOS() && (
        <div>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-50 text-slate-500">
                Or continue with
              </span>
            </div>
          </div>
          <Form
            className="flex justify-center"
            action="/api/auth/google"
            method="post"
          >
            <button type="submit">
              <img
                src="/assets/google-button.svg"
                alt="Sign in with Google"
                width={195}
                height={50}
              />
            </button>
          </Form>
        </div>
      )}
    </>
  );
};
