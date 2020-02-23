import React from 'react';

import FirebaseAuth from 'views/misc/FirebaseAuth';
import Error from 'views/misc/Error';
import logIn from 'actions/logIn';
import createPost from 'actions/createPost';
import { Page } from 'styles/layout';
import PostForm from './PostForm';

const PostNew = ({ history }) => (
  <Page>
    <FirebaseAuth>
      {({ isLoading, error, auth }) => {
        if (error) {
          return <Error error={error} />;
        }

        if (isLoading) {
          return <div>loading...</div>;
        }

        if (!auth) {
          return (
            <div>
              <p>You must be logged in to add posts</p>
              <button onClick={logIn}>log in</button>
            </div>
          );
        }

        return (
          <PostForm
            onSubmit={values =>
              createPost(values).then(post => history.push(`/${post.slug}`))
            }
          />
        );
      }}
    </FirebaseAuth>
  </Page>
);

export default PostNew;
