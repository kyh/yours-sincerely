import React from "react";
import styled, { css } from "styled-components";
import firebase from "firebase/app";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import {
  getUserLikeQuery,
  likePost,
  unlikePost,
} from "features/posts/actions/likeActions";

export const LikeButton = ({ postId, post }) => {
  const [user, isLoadingAuth] = useAuthState(firebase.auth());
  const [collection, isLoadingCollection, error] = useCollection(
    getUserLikeQuery(postId, user && user.uid)
  );

  if (error || isLoadingAuth || isLoadingCollection) {
    return <StyledLikeButton disabled />;
  }

  const [userLikeDoc] = collection.docs;
  const userLike = userLikeDoc ? userLikeDoc.data() : null;

  return (
    <LikeContainer>
      <StyledLikeButton
        disabled={!user}
        isLiked={userLike}
        onClick={() =>
          userLike ? unlikePost(userLikeDoc.id) : likePost(postId)
        }
      >
        <span>{post._likeCount || 0}</span>
      </StyledLikeButton>
    </LikeContainer>
  );
};

const LikeContainer = styled.div`
  display: inline-flex;
  align-items: center;
  margin-left: -16px;
`;

const StyledLikeButton = styled.button`
  width: 50px;
  height: 50px;
  background-image: url("/assets/like.png");
  background-size: 1450px 50px;
  span {
    margin-left: 40px;
  }
  :disabled {
    cursor: default;
  }

  ${({ isLiked }) =>
    isLiked &&
    css`
      animation-name: like;
      animation-duration: 1s;
      animation-timing-function: steps(28);
      animation-fill-mode: forwards;
    `}

  @keyframes like {
    100% {
      background-position-x: right;
    }
  }
`;
