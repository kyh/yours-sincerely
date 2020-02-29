import React from 'react';
import styled, { css } from 'styled-components';
import { FirestoreCollection } from 'react-firestore';

import { likePost, unlikePost } from 'features/posts/actions/likeActions';
import { FirebaseAuth } from 'features/auth/FirebaseAuth';

export const LikeButton = ({ post }) => {
  return (
    <FirebaseAuth>
      {({ auth }) => {
        const filter = [['postId', '==', post.id]];
        if (auth) filter.push(['createdBy', '==', auth.uid]);
        return (
          <FirestoreCollection path="postLikes" filter={filter}>
            {({ error, isLoading, data }) => {
              if (error || isLoading) return <StyledLikeButton disabled />;
              const [userLike] = data;
              return (
                <LikeContainer>
                  <StyledLikeButton
                    disabled={!auth}
                    isLiked={userLike}
                    onClick={() =>
                      userLike ? unlikePost(userLike) : likePost(post)
                    }
                  >
                    <span>{post._likeCount || 0}</span>
                  </StyledLikeButton>
                </LikeContainer>
              );
            }}
          </FirestoreCollection>
        );
      }}
    </FirebaseAuth>
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
  background-image: url('/assets/like.png');
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
