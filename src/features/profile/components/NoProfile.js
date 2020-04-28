import React from "react";
import { Link } from "react-router-dom";
import { login, loginTypes } from "features/auth/actions/authActions";
import { isIOS } from "util/platform";
import { ConnectSection } from "components/ConnectSection";
import { Text } from "components/Text";
import { ProfileDetails } from "./ProfileDetails";

export const NoProfile = () => {
  return (
    <>
      <ProfileDetails>
        <img src="/assets/dancing.svg" alt="Not logged in" />
        <div>
          {isIOS() ? (
            <>
              <h1>No account required</h1>
              <Text>
                Just <Link to="/new">make a post</Link> to get started
              </Text>
            </>
          ) : (
            <>
              <h1>You’re not signed in...</h1>
              <Text>
                But, you can still <Link to="/new">make a post</Link>{" "}
                anonymously without an account
              </Text>
            </>
          )}
        </div>
      </ProfileDetails>
      {!isIOS() && (
        <ConnectSection text="Or sign in with" bg="#f5f8fa">
          <button type="button" onClick={() => login(loginTypes.google)}>
            <img src="/assets/google-button.svg" alt="Sign in with Google" />
          </button>
        </ConnectSection>
      )}
    </>
  );
};
