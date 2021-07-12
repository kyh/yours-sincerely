import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ContentLoader from "react-content-loader";
import mojs from "@mojs/core";
import { lightTheme } from "util/theme";
import { useAuth } from "actions/auth";
import { likePost, unlikePost } from "actions/post";

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
const createCircleAnimation = (el) => {
  if (!el) return;
  return new mojs.Shape({
    parent: el,
    className: "pointer-none",
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

const BURST_RADIUS = 32;
const createBurstAnimation = (el) => {
  if (!el) return;
  return new mojs.Burst({
    parent: el,
    className: "pointer-none",
    left: 8,
    radius: { 4: BURST_RADIUS },
    angle: 45,
    count: 14,
    timeline: { delay: 300 },
    children: {
      radius: 2.5,
      fill: [
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
    },
  });
};

const useHeartAnimation = (iconRef, iconContainerRef) => {
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
  }, []);

  return playAnimation;
};

export const LikeButton = ({ isLoading, post, defaultLikeId }) => {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(post._likeCount || 0);
  const [likeId, setLikeId] = useState(defaultLikeId);
  const iconRef = useRef(null);
  const iconContainerRef = useRef(null);
  const playAnimation = useHeartAnimation(iconRef, iconContainerRef);

  const toggleLike = async () => {
    if (likeId) {
      setLikeCount(likeCount - 1);
      await unlikePost(likeId);
      setLikeId(null);
    } else {
      setLikeCount(likeCount + 1);
      playAnimation();
      const like = await likePost(post.id);
      setLikeId(like.id);
    }
  };

  if (isLoading) {
    return (
      <div>
        <LikeLoader />
      </div>
    );
  }

  return (
    <div>
      <StyledLikeButton
        ref={iconContainerRef}
        disabled={!user}
        isLiked={!!likeId}
        onClick={toggleLike}
      >
        <StyledIcon
          ref={iconRef}
          color={likeId ? lightTheme.colors.red : lightTheme.colors.grey}
          viewBox="0 0 24 24"
        >
          <path d="m18.199 2.04c-2.606-.284-4.262.961-6.199 3.008-2.045-2.047-3.593-3.292-6.199-3.008-3.544.388-6.321 4.43-5.718 7.96.966 5.659 5.944 9 11.917 12 5.973-3 10.951-6.341 11.917-12 .603-3.53-2.174-7.572-5.718-7.96z"></path>
        </StyledIcon>
        <span>{likeCount}</span>
      </StyledLikeButton>
    </div>
  );
};

const StyledLikeButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 30px;
  width: 40px;
  border-radius: 5px;
  &:disabled {
    cursor: default;
  }
  span {
    margin-left: 10px;
  }
`;

const StyledIcon = styled.svg`
  width: 16px;
  height: 16px;
  fill: currentcolor;
  stroke: currentcolor;
  transition: fill 0.23s ease 0s;

  path {
    transition: stroke 0.2s ease, fill 0.2s ease;
    stroke: ${({ theme, color }) =>
      color ? theme.colors[color] : theme.ui.text};
  }
`;

const LikeLoader = ({ postId }) => (
  <ContentLoader
    uniqueKey={`like-loader-${postId}`}
    height={30}
    width={40}
    speed={3}
  >
    <rect x="0" y="5" width="100%" height="20px" rx="4" ry="4" />
  </ContentLoader>
);

export default LikeButton;
