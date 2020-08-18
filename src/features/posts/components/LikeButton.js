import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ContentLoader from "react-content-loader";
import mojs from "@mojs/core";
import firebase from "firebase/app";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import {
  getUserLikeQuery,
  likePost,
  unlikePost,
} from "features/posts/actions/likeActions";
import { Icon } from "components/Icon";

const createHeartAnimation = (el) => {
  if (!el) return;
  return new mojs.Html({
    el,
    scale: { 0: 1 },
    easing: "elastic.out",
    duration: 1000,
    delay: 300,
    radius: 11,
  }).play(1000);
};

const CIRCLE_RADIUS = 20;
const RADIUS = 32;
const createCircleAnimation = (el) => {
  if (!el) return;
  return new mojs.Shape({
    parent: el,
    left: 8,
    stroke: { "#E5214A": "#CC8EF5" },
    strokeWidth: { [2 * CIRCLE_RADIUS]: 0 },
    fill: "none",
    scale: { 0: 1 },
    radius: CIRCLE_RADIUS,
    duration: 400,
    easing: "cubic.out",
  });
};

const createBurstAnimation = (el) => {
  if (!el) return;
  return new mojs.Burst({
    parent: el,
    left: 8,
    radius: { 4: RADIUS },
    angle: 45,
    count: 14,
    timeline: { delay: 300 },
    children: {
      radius: 2.5,
      fill: [
        // { '#91D2FA' : '#BDEFD8' },
        // { '#91D2FA' : '#ADD6CA' },
        { "#9EC9F5": "#9ED8C6" },
        { "#91D3F7": "#9AE4CF" },

        { "#DC93CF": "#E3D36B" },
        { "#CF8EEF": "#CBEB98" },

        { "#87E9C6": "#1FCC93" },
        { "#A7ECD0": "#9AE4CF" },

        { "#87E9C6": "#A635D9" },
        { "#D58EB3": "#E0B6F5" },

        { "#F48BA2": "#CF8EEF" },
        { "#91D3F7": "#A635D9" },

        { "#CF8EEF": "#CBEB98" },
        { "#87E9C6": "#A635D9" },
      ],
      scale: { 1: 0, easing: "quad.in" },
      pathScale: [0.8, null],
      degreeShift: [13, null],
      duration: [500, 700],
      easing: "quint.out",
      // speed: .1
    },
  });
};

const useHeartAnimation = (deps = [], iconRef, iconContainerRef) => {
  const heart = useRef(null);
  const circle = useRef(null);
  const burst = useRef(null);

  const playAnimation = () => {
    heart.current.replay();
    burst.current.replay();
    circle.current.replay();
  };

  useEffect(() => {
    heart.current = createHeartAnimation(iconRef.current);
    circle.current = createCircleAnimation(iconContainerRef.current);
    burst.current = createBurstAnimation(iconContainerRef.current);
  }, deps);

  return playAnimation;
};

export const LikeButton = ({ postId, post }) => {
  const [user, isLoadingAuth] = useAuthState(firebase.auth());
  const [collection, isLoadingCollection, error] = useCollection(
    getUserLikeQuery(postId, user && user.uid)
  );
  const [postLikeCount, setPostLikeCount] = useState(post._likeCount || 0);
  const iconRef = useRef(null);
  const iconContainerRef = useRef(null);
  const playAnimation = useHeartAnimation(
    [isLoadingAuth, isLoadingCollection],
    iconRef,
    iconContainerRef
  );

  if (error || isLoadingAuth || isLoadingCollection) {
    return (
      <div>
        <LikeLoader />
      </div>
    );
  }

  const [userLikeDoc] = collection.docs;
  const userLike = userLikeDoc ? userLikeDoc.data() : null;

  return (
    <div>
      <StyledLikeButton
        ref={iconContainerRef}
        disabled={!user}
        isLiked={userLike}
        onClick={() => {
          if (userLike) {
            unlikePost(userLikeDoc.id);
            setPostLikeCount(postLikeCount - 1);
          } else {
            likePost(postId);
            setPostLikeCount(postLikeCount + 1);
            playAnimation();
          }
        }}
      >
        <StyledIcon
          ref={iconRef}
          icon="heart"
          size="xs"
          color={userLike ? "red" : "grey"}
        />
        <span>{postLikeCount}</span>
      </StyledLikeButton>
    </div>
  );
};

const StyledLikeButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 50px;
  height: 30px;
  border-radius: 5px;
  &:disabled {
    cursor: default;
  }
  span {
    margin-left: 10px;
  }
`;

const StyledIcon = styled(Icon)`
  path {
    transition: stroke 0.2s ease, fill 0.2s ease;
    stroke: ${({ theme, color }) =>
      color ? theme.colors[color] : theme.ui.text};
  }
`;

const LikeLoader = () => (
  <ContentLoader height={30} width={50} speed={3}>
    <rect x="0" y="5" width="100%" height="20px" rx="4" ry="4" />
  </ContentLoader>
);
