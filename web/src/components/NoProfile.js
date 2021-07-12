import React from "react";
import Link from "next/link";
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
        <img src="/assets/dancing.svg" alt="Not logged in" />
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
            <img src="/assets/google-button.svg" alt="Sign in with Google" />
          </button>
        </ConnectSection>
      )}
    </>
  );
};
