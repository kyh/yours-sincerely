import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import ContentLoader from "react-content-loader";
import { Error } from "components/Error";
import { PageLayout, PageContent } from "components/Page";
import { PostContent } from "components/PostContent";
import { PostFooter, PostFooterRight } from "components/PostFooter";
import { PostSignature } from "components/PostSignature";
import { ShareButton } from "components/ShareButton";
import { FlagButton } from "components/FlagButton";
import { useAuth } from "actions/auth";
import { usePost, usePostLikes } from "actions/post";

const LikeButton = dynamic(() => import("components/LikeButton"), {
  ssr: false,
  loading: () => (
    <ContentLoader height={30} width={40} speed={3}>
      <rect x="0" y="5" width="100%" height="20px" rx="4" ry="4" />
    </ContentLoader>
  ),
});

const Post = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { status: postStatus, data: post, error } = usePost(router.query.pid);
  const { dataMap: likesMap } = usePostLikes(user && user.uid);

  return (
    <>
      <Head>
        <title>
          Yours Sincerely | {post ? post.createdByDisplayName : "Loading"}
        </title>
      </Head>
      <PageContent>
        {postStatus === "loading" && <PostContentLoader />}
        {error && <Error error={error} />}
        {postStatus === "success" && post && (
          <>
            <PostContent>
              {post._flagged ? "This post is under review" : post.content}
            </PostContent>
            <PostFooter>
              <PostSignature>{post.createdByDisplayName}</PostSignature>
              <PostFooterRight>
                <ShareButton post={post} />
                <LikeButton post={post} defaultLikeId={likesMap[post.id]} />
                <FlagButton post={post} />
              </PostFooterRight>
            </PostFooter>
          </>
        )}
      </PageContent>
    </>
  );
};

Post.Layout = PageLayout;

const PostContentLoader = () => (
  <ContentLoader uniqueKey="post-loader" height={300} width="100%" speed={3}>
    <rect x="0" y="0" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="40" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="80" width="30%" height="25" rx="4" ry="4" />
  </ContentLoader>
);

export default Post;
