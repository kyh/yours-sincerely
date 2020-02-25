import React from 'react';

import logIn from 'actions/logIn';
import FirebaseAuth from 'views/misc/FirebaseAuth';
import Error from 'views/misc/Error';

import PageContent from 'components/PageContent';
import Profile from './Profile';

const Account = () => (
  <PageContent>
    <FirebaseAuth>
      {({ isLoading, error, auth }) => {
        if (isLoading) return <p>loading...</p>;
        if (error) return <Error error={error} />;
        if (!auth) {
          return (
            <div>
              <p>Log in to see your account</p>
              <button onClick={() => logIn('google')}>Log in</button>
            </div>
          );
        }

        return <Profile auth={auth} />;
      }}
    </FirebaseAuth>
  </PageContent>
);

export default Account;
