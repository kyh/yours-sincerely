import React from 'react';
import styled from 'styled-components';
import Firebase from 'firebase/app';
import { addDays, formatDistance } from 'date-fns';

const getPercentage = createdAt => {
  const now = Firebase.firestore.Timestamp.now().toDate();
  const start = createdAt.toDate();
  const end = addDays(createdAt.toDate(), 7);
  return {
    now,
    start,
    end,
    percentage: Math.round(((now - start) / (end - start)) * 100)
  };
};

export const PostTimer = ({ post, ...rest }) => {
  const { percentage, now, end } = getPercentage(post.createdAt);
  return (
    <Pie
      percentage={percentage}
      data-tip={`Post expires in ${formatDistance(now, end)}.`}
      {...rest}
    />
  );
};

const Pie = styled.div`
  position: relative;
  display: inline-block;
  background-image: conic-gradient(
    rgba(255, 255, 255, 0.6) calc(3.6deg * ${({ percentage }) => percentage}),
    rgba(0, 0, 0, 0) calc(3.6deg * ${({ percentage }) => percentage})
  );
  background-blend-mode: overlay;
  background-position: 50% 50%;
  background-size: 150%; /* oversize bg image to prevent "underdraw" */
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.lightGrey};
`;
