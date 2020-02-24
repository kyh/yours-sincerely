import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ContentLoader from 'react-content-loader';
import FirebaseAuth from 'views/misc/FirebaseAuth';
import Error from 'views/misc/Error';
import createPost from 'actions/createPost';

import PageContainer from 'components/PageContainer';
import Navigation from 'components/Navigation';
import Logo from 'components/Logo';
import Modal from 'components/Modal';

import PostForm from './PostForm';
import PostAuthForm from './PostAuthForm';

const PostNew = ({ history }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const onCreatePost = async () => {
    const postString = localStorage.getItem('post');
    await createPost(JSON.parse(postString));
    localStorage.removeItem('post');
    history.push('/');
  };

  return (
    <PageContainer background="white">
      <Navigation>
        <Link to="/">
          <Logo />
        </Link>
      </Navigation>
      <FirebaseAuth>
        {({ isLoading, error, auth }) => {
          if (error) return <Error error={error} />;
          if (isLoading) return <PostNewContentLoader />;
          return (
            <PostForm
              post={JSON.parse(localStorage.getItem('post') || '{}')}
              onSubmit={async post => {
                const postString = JSON.stringify(post);
                localStorage.setItem('post', postString);
                if (!auth) {
                  setIsLoginModalOpen(true);
                } else {
                  onCreatePost();
                }
              }}
            />
          );
        }}
      </FirebaseAuth>
      <Modal
        open={isLoginModalOpen}
        title="Are you a real person?"
        onRequestClose={() => setIsLoginModalOpen(false)}
        maxWidth={600}
        closeButton
      >
        <PostAuthForm onSubmit={onCreatePost} />
      </Modal>
    </PageContainer>
  );
};

const PostNewContentLoader = () => (
  <ContentLoader
    height={300}
    width="100%"
    speed={3}
    primaryColor="#f3f3f3"
    secondaryColor="#ecebeb"
  >
    <rect x="0" y="20" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="60" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="100" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="140" width="60%" height="25" rx="4" ry="4" />
  </ContentLoader>
);

export default PostNew;
