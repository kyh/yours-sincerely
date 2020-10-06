import React from "react";
import { useParams } from "react-router-dom";
import { useDocument } from "react-firebase-hooks/firestore";
import ContentLoader from "react-content-loader";

import { Error } from "features/misc/Error";
import { PageContent } from "components/Page";

import { PostContent } from "./components/PostContent";
import { PostFooter, PostFooterRight } from "./components/PostFooter";
import { PostSignature } from "./components/PostSignature";
import { LikeButton } from "./components/LikeButton";
import { ShareButton } from "./components/ShareButton";
import { FlagButton } from "./components/FlagButton";
import { getPostQuery } from "./actions/postActions";

export const Post = () => {
  const { postId } = useParams();
  const [doc, isLoading, error] = useDocument(getPostQuery(postId));
  const post = doc ? doc.data() : null;
  return (
    <PageContent>
      {isLoading && <PostContentLoader />}
      {!isLoading && error && <Error error={error} />}
      {!isLoading && post && (
        <>
          <PostContent>
            {post._flagged ? "This post is under review" : post.content}
          </PostContent>
          <PostFooter>
            <PostSignature>{post.createdByDisplayName}</PostSignature>
            <PostFooterRight>
              <ShareButton postId={doc.id} />
              <LikeButton postId={doc.id} post={post} />
              <FlagButton postId={doc.id} post={post} />
            </PostFooterRight>
          </PostFooter>
        </>
      )}
    </PageContent>
  );
};

const PostContentLoader = () => (
  <ContentLoader height={300} width="100%" speed={3}>
    <rect x="0" y="0" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="40" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="80" width="30%" height="25" rx="4" ry="4" />
  </ContentLoader>
);
