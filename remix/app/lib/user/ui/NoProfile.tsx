import { Link } from "remix";
import { Divide } from "~/lib/core/ui/Divide";
import { isIOS } from "~/lib/core/util/platform";
import { SocialLoginForm } from "~/lib/auth/ui/SocialLoginForm";

export const NoProfile = () => {
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
          <Divide>Or continue with</Divide>
          <SocialLoginForm />
        </div>
      )}
    </>
  );
};
