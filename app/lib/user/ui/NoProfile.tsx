import { Link } from "remix";
import { Divider } from "~/lib/core/ui/Divider";
import { SocialLoginForm } from "~/lib/auth/ui/SocialLoginForm";
import { usePlatform } from "~/lib/core/ui/Platform";

export const NoProfile = () => {
  const { isWeb } = usePlatform();
  return (
    <>
      <section className="sm:flex">
        <img
          className="m-auto sm:w-1/2"
          src="/assets/dancing.svg"
          alt="Not logged in"
          width={300}
          height={225}
        />
        <div className="sm:w-1/2">
          {!isWeb ? (
            <>
              <h1 className="my-5 text-3xl font-bold">No account required</h1>
              <p>
                Just <Link to="/posts/new">make a post</Link> to get started
              </p>
            </>
          ) : (
            <>
              <h1 className="my-5 text-3xl font-bold">
                You’re not signed in...
              </h1>
              <p>
                But, you can still <Link to="/posts/new">make a post</Link>{" "}
                anonymously without an account
              </p>
            </>
          )}
        </div>
      </section>
      {isWeb && (
        <div>
          <Divider>Or continue with</Divider>
          <SocialLoginForm />
        </div>
      )}
    </>
  );
};
