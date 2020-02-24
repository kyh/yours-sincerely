import React from 'react';
import Firebase from 'firebase/app';
import styled from 'styled-components';
import { FirestoreCollection } from 'react-firestore';
import { Link } from 'react-router-dom';
import ContentLoader from 'react-content-loader';

import Error from 'views/misc/Error';
import PageContent from 'components/PageContent';

const getNDaysAgo = n => {
  const date = new Date();
  const pastDate = date.getDate() - n;
  date.setDate(pastDate);
  return date;
};

const PostList = () => (
  <PageContent>
    <FirestoreCollection
      path="posts"
      sort="createdAt:desc"
      filter={[
        'createdAt',
        '>=',
        Firebase.firestore.Timestamp.fromDate(getNDaysAgo(7))
      ]}
    >
      {({ error, isLoading, data }) => {
        if (error) return <Error error={error} />;
        if (isLoading) return <FeedContentLoader />;
        if (data.length === 0) return <EmptyPost />;

        return (
          <div>
            {data.map(post => (
              <div key={post.id}>
                <Link to={`/${post.slug}`}>{post.content}</Link>
                <p>
                  {post._likeCount || 0}{' '}
                  {post._likeCount && post._likeCount === 1 ? 'like' : 'likes'}
                </p>
              </div>
            ))}
          </div>
        );
      }}
    </FirestoreCollection>
  </PageContent>
);

const FeedContentLoader = () => (
  <ContentLoader
    height={300}
    width="100%"
    speed={3}
    primaryColor="#f3f3f3"
    secondaryColor="#ecebeb"
  >
    <rect x="0" y="0" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="40" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="80" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="120" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="160" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="200" width="100%" height="25" rx="4" ry="4" />
    <rect x="0" y="240" width="100%" height="25" rx="4" ry="4" />
  </ContentLoader>
);

const EmptyPost = () => (
  <EmptyPostContainer>
    <h1>
      It's kind of lonely here... could you help{' '}
      <Link to="/new">start something?</Link>
    </h1>
    <img src="/assets/reading.svg" alt="No posts" />
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

export default PostList;
