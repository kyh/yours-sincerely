import Link from "next/link";
import Image from "next/image";
import { ConnectSection } from "components/ConnectSection";
import { Text } from "components/Text";
import { ProfileDetails } from "components/ProfileDetails";
import { useAuth } from "actions/auth";
import { isIOS } from "util/platform";

export const NoProfile = () => {
  const { signinWithProvider } = useAuth();

  const googleLogin = () => {
    signinWithProvider("google");
  };

  return (
    <>
      <ProfileDetails>
        <Image
          src="/assets/dancing.svg"
          alt="Not logged in"
          width={300}
          height={225}
        />
        <div>
          {isIOS() ? (
            <>
              <h1>No account required</h1>
              <Text>
                Just{" "}
                <Link href="/new">
                  <a>make a post</a>
                </Link>{" "}
                to get started
              </Text>
            </>
          ) : (
            <>
              <h1>You’re not signed in...</h1>
              <Text>
                But, you can still{" "}
                <Link href="/new">
                  <a>make a post</a>
                </Link>{" "}
                anonymously without an account
              </Text>
            </>
          )}
        </div>
      </ProfileDetails>
      {!isIOS() && (
        <ConnectSection text="Or sign in with" bg="#f5f8fa">
          <button type="button" onClick={googleLogin}>
            <Image
              src="/assets/google-button.svg"
              alt="Sign in with Google"
              width={195}
              height={50}
            />
          </button>
        </ConnectSection>
      )}
    </>
  );
};
