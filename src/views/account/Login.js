import React from 'react';
import styled from 'styled-components';
import { Redirect, Link } from 'react-router-dom';

import logIn, { loginTypes } from 'actions/logIn';
import FirebaseAuth from 'views/misc/FirebaseAuth';
import Error from 'views/misc/Error';

import Logo from 'components/Logo';

const Login = () => (
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
              <button onClick={() => logIn(loginTypes.google)}>
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

export default Login;
