import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import ContentLoader from "react-content-loader";
import { SEO } from "components/SEO";
import { PageContainer } from "components/Page";
import { Navigation } from "components/Navigation";
import { Logo } from "components/Logo";
import { Modal } from "components/Modal";
import { PostForm, postKey, getStoredPostAndClear } from "components/PostForm";
import { PostAuthForm } from "components/PostAuthForm";
import { useAuth } from "actions/auth";
import { createPost } from "actions/post";

const PostNew = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubisSubmitting] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user, getCurrentUserClaim } = useAuth();

  const onCreatePost = async () => {
    setIsSubisSubmitting(true);
    const idTokenResult = await getCurrentUserClaim();
    if (idTokenResult.claims.flagged) {
      alert(
        "Sorry, something you posted has been marked inappropriate, we have suspended your account until we review your post"
      );
      setIsSubisSubmitting(false);
      return;
    }

    const post = getStoredPostAndClear();
    await createPost(post);
    router.push("/");
  };

  return (
    <>
      <SEO title="New Post" />
      <PageContainer background="white">
        <Navigation>
          <Link href="/">
            <a>
              <Logo />
            </a>
          </Link>
        </Navigation>
        {user === null && <PostNewContentLoader />}
        {user !== null && (
          <PostForm
            postingAs={user ? user.displayName : null}
            post={JSON.parse(localStorage.getItem(postKey) || "{}")}
            isSubmitting={isSubmitting}
            onSubmit={() =>
              !!user ? onCreatePost() : setIsLoginModalOpen(true)
            }
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
    </>
  );
};

const PostNewContentLoader = () => (
  <ContentLoader uniqueKey="new-loader" height={300} width="100%" speed={3}>
    <rect x="0" y="20" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="60" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="100" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="140" width="60%" height="25" rx="4" ry="4" />
  </ContentLoader>
);

export default PostNew;
