import React from "react";
import firebase from "firebase/app";
import { useAuthState } from "react-firebase-hooks/auth";
import ContentLoader from "react-content-loader";

import { Error } from "features/misc/Error";
import { PageContent } from "components/Page";
import { Profile } from "./components/Profile";
import { NoProfile } from "./components/NoProfile";

export const ProfilePage = () => {
  const [user, isLoading, error] = useAuthState(firebase.auth());
  return (
    <PageContent>
      {isLoading && <ProfileLoader />}
      {!isLoading && error && <Error error={error} />}
      {!isLoading && !user && <NoProfile />}
      {!isLoading && user && <Profile user={user} />}
    </PageContent>
  );
};

const ProfileLoader = () => (
  <ContentLoader height={300} width="100%" speed={3}>
    <rect x="0" y="0" width="50%" height="225" rx="4" ry="4" />
    <rect x="55%" y="0" width="45%" height="40" rx="4" ry="4" />
    <rect x="55%" y="50" width="35%" height="25" rx="4" ry="4" />
  </ContentLoader>
);
