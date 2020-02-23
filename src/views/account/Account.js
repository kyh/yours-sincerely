import React from 'react';

import logIn from 'actions/logIn';
import FirebaseAuth from 'views/misc/FirebaseAuth';
import Error from 'views/misc/Error';

import { Page } from 'styles/layout';
import Profile from './Profile';

const Account = () => (
  <Page>
    <FirebaseAuth>
      {({ isLoading, error, auth }) => {
        if (isLoading) {
          return <p>loading...</p>;
        }

        if (error) {
          return <Error error={error} />;
        }

        if (!auth) {
          return (
            <div>
              <p>Log in to see your account</p>
              <button onClick={logIn}>Log in</button>
            </div>
          );
        }

        return (
          <div>
            <Profile auth={auth} />
          </div>
        );
      }}
    </FirebaseAuth>
  </Page>
);

export default Account;
