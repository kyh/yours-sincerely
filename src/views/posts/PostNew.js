import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import FirebaseAuth from 'views/misc/FirebaseAuth';
import Error from 'views/misc/Error';
import logIn, { loginTypes } from 'actions/logIn';
import createPost from 'actions/createPost';

import PageContainer from 'components/PageContainer';
import Navigation from 'components/Navigation';
import Logo from 'components/Logo';

import PostForm from './PostForm';

const PostNew = ({ history }) => (
  <PageContainer background="white">
    <Navigation>
      <Link to="/">
        <Logo />
      </Link>
    </Navigation>
    <FirebaseAuth>
      {({ isLoading, error, auth }) => {
        if (error) return <Error error={error} />;
        if (isLoading) return <div>loading...</div>;
        return (
          <PostForm
            onSubmit={async values => {
              if (!auth) {
                return;
              }
              await createPost(values);
              history.push('/');
            }}
          />
        );
      }}
    </FirebaseAuth>
  </PageContainer>
);

export default PostNew;
