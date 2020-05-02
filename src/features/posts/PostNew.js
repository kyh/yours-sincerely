import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import ContentLoader from "react-content-loader";
import firebase from "firebase/app";
import { useAuthState } from "react-firebase-hooks/auth";

import { Error } from "features/misc/Error";

import { PageContainer } from "components/Page";
import { Navigation } from "components/Navigation";
import { Logo } from "components/Logo";
import { Modal } from "components/Modal";

import { createPost } from "./actions/postActions";

import { PostForm } from "./components/PostForm";
import { PostAuthForm } from "./components/PostAuthForm";

export const PostNew = () => {
  const history = useHistory();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, isLoading, error] = useAuthState(firebase.auth());

  const onCreatePost = async () => {
    if (user._flagged) {
      alert(
        "Sorry, something you posted has been marked inappropriate, we have suspended your account until we review your post"
      );
      return;
    }
    const postString = localStorage.getItem("post");
    await createPost(JSON.parse(postString));
    localStorage.removeItem("post");
    history.push("/");
  };

  return (
    <PageContainer background="white">
      <Navigation>
        <Link to="/">
          <Logo />
        </Link>
      </Navigation>
      {isLoading && <PostNewContentLoader />}
      {!isLoading && error && <Error error={error} />}
      {!isLoading && (
        <PostForm
          postingAs={user ? user.displayName : null}
          post={JSON.parse(localStorage.getItem("post") || "{}")}
          onSubmit={async (post) => {
            const postString = JSON.stringify(post);
            localStorage.setItem("post", postString);
            if (!user) {
              setIsLoginModalOpen(true);
            } else {
              onCreatePost();
            }
          }}
        />
      )}
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
  <ContentLoader height={300} width="100%" speed={3}>
    <rect x="0" y="20" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="60" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="100" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="140" width="60%" height="25" rx="4" ry="4" />
  </ContentLoader>
);
