import React from 'react';
import styled from 'styled-components';
import { Redirect, Link } from 'react-router-dom';

import { login, loginTypes } from 'features/auth/actions/authActions';
import { FirebaseAuth } from 'features/auth/FirebaseAuth';
import { Error } from 'features/misc/Error';

import { Logo } from 'components/Logo';

export const Login = () => (
  <FullPage>
    <FirebaseAuth>
      {({ isLoading, error, auth }) => {
        if (isLoading) return <p>loading...</p>;
        if (error) return <Error error={error} />;
        if (auth) return <Redirect path="/" />;
        return (
          <LoginFormContainer>
            <LoginForm>
              <Link to="/">
                <Logo />
              </Link>
              <h3>Welcome back</h3>
              <p>Log into your account</p>
              <button onClick={() => login(loginTypes.google)}>
                Log in with googs
              </button>
            </LoginForm>
          </LoginFormContainer>
        );
      }}
    </FirebaseAuth>
  </FullPage>
);

const FullPage = styled.section``;

const LoginFormContainer = styled.section``;

const LoginForm = styled.form``;
