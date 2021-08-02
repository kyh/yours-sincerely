import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import styled from "styled-components";
import ContentLoader from "react-content-loader";
import ReactTooltip from "react-tooltip";
import { SEO } from "components/SEO";
import { Error } from "components/Error";
import { PageLayout, PageContent } from "components/Page";
import { PostTimer } from "components/PostTimer";
import { PostContent } from "components/PostContent";
import { PostFooter, PostFooterRight } from "components/PostFooter";
import { PostSignature } from "components/PostSignature";
import { ShareButton } from "components/ShareButton";
import { useAuth } from "actions/auth";
import { usePosts, usePostLikes } from "actions/post";

const LikeButton = dynamic(() => import("components/LikeButton"), {
  ssr: false,
  loading: () => (
    <ContentLoader height={30} width={40} speed={3}>
      <rect x="0" y="5" width="100%" height="20px" rx="4" ry="4" />
    </ContentLoader>
  ),
});

export const PostList = () => {
  const { user } = useAuth();
  const { status: postsStatus, data: posts, error } = usePosts();
  const { dataMap: likesMap } = usePostLikes(user && user.uid);

  return (
    <>
      <SEO />
      <PageContent>
        {postsStatus === "loading" && <FeedContentLoader />}
        {error && <Error error={error} />}
        {postsStatus === "success" && !posts.length && <EmptyPost />}
        {postsStatus === "success" && !!posts.length && (
          <div>
            {posts.map((post) => {
              return (
                <PostContainer key={post.id}>
                  <Link href={`/${post.id}`}>
                    <a>
                      <PostContent>{post.content}</PostContent>
                    </a>
                  </Link>
                  <PostFooter>
                    <PostSignature>{post.createdByDisplayName}</PostSignature>
                    <PostFooterRight>
                      <ShareButton post={post} />
                      <LikeButton
                        post={post}
                        defaultLikeId={likesMap[post.id]}
                      />
                      <PostTimer post={post} />
                    </PostFooterRight>
                  </PostFooter>
                </PostContainer>
              );
            })}
            <ReactTooltip
              effect="solid"
              event="mouseenter click"
              eventOff="mouseout"
            />
          </div>
        )}
      </PageContent>
    </>
  );
};

PostList.Layout = PageLayout;

const FeedContentLoader = () => (
  <ContentLoader uniqueKey="feed-loader" height={300} width="100%" speed={3}>
    <rect x="0" y="0" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="40" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="80" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="120" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="160" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="200" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="240" width="40%" height="25" rx="4" ry="4" />
  </ContentLoader>
);

const EmptyPost = () => (
  <EmptyPostContainer>
    <h1>
      It's kind of lonely here... could you help{" "}
      <Link href="/new">
        <a>start something?</a>
      </Link>
    </h1>
    <Image src="/assets/reading.svg" alt="No posts" width={400} height={300} />
  </EmptyPostContainer>
);

const EmptyPostContainer = styled.section`
  max-width: 400px;
  margin: 0 auto;
  text-align: center;

  h1 {
    font-size: ${({ theme }) => theme.typography.h4.fontSize};
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
    &:hover {
      text-decoration: underline;
    }
  }
`;

const PostContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacings(7)};
`;

export default PostList;
