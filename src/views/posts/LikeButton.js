import React from 'react';
import styled, { css } from 'styled-components';
import { FirestoreCollection } from 'react-firestore';

import likePost from 'actions/likePost';
import unlikePost from 'actions/unlikePost';
import FirebaseAuth from 'views/misc/FirebaseAuth';

const LikeButton = ({ post }) => (
  <FirebaseAuth>
    {({ isLoading, error, auth }) => {
      if (!auth || isLoading || error) return <StyledLikeButton disabled />;
      return (
        <FirestoreCollection
          path="postLikes"
          filter={[
            ['postId', '==', post.id],
            ['createdBy', '==', auth.uid]
          ]}
        >
          {({ error, isLoading, data }) => {
            if (error || isLoading) return <StyledLikeButton disabled />;
            const [userLike] = data;
            return (
              <LikeContainer>
                <StyledLikeButton
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

export default LikeButton;
