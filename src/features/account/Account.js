import React from 'react';
import ContentLoader from 'react-content-loader';
import { FirebaseAuth } from 'features/auth/FirebaseAuth';
import { Error } from 'features/misc/Error';
import { PageContent } from 'components/Page';
import { Profile } from './Profile';
import { NoProfile } from './NoProfile';

export const Account = () => (
  <PageContent>
    <FirebaseAuth>
      {({ isLoading, error, auth }) => {
        if (isLoading) return <AccountLoader />;
        if (error) return <Error error={error} />;
        if (!auth) return <NoProfile />;
        return <Profile auth={auth} />;
      }}
    </FirebaseAuth>
  </PageContent>
);

const AccountLoader = () => (
  <ContentLoader
    height={300}
    width="100%"
    speed={3}
    primaryColor="#f3f3f3"
    secondaryColor="#ecebeb"
  >
    <rect x="0" y="0" width="50%" height="225" rx="4" ry="4" />
    <rect x="55%" y="0" width="45%" height="40" rx="4" ry="4" />
    <rect x="55%" y="50" width="35%" height="25" rx="4" ry="4" />
  </ContentLoader>
);
