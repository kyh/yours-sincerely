import React from 'react';

import { login } from 'features/auth/actions/authActions';
import { FirebaseAuth } from 'features/auth/FirebaseAuth';
import { Error } from 'features/misc/Error';
import { PageContent } from 'components/Page';
import { Profile } from './Profile';

export const Account = () => (
  <PageContent>
    <FirebaseAuth>
      {({ isLoading, error, auth }) => {
        if (isLoading) return <p>loading...</p>;
        if (error) return <Error error={error} />;
        if (!auth) {
          return (
            <div>
              <p>Log in to see your account</p>
              <button onClick={() => login('google')}>Log in</button>
            </div>
          );
        }

        return <Profile auth={auth} />;
      }}
    </FirebaseAuth>
  </PageContent>
);
