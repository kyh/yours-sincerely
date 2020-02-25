import React from 'react';
import Firebase from 'firebase/app';
import styled from 'styled-components';
import { FirestoreCollection } from 'react-firestore';
import { Link } from 'react-router-dom';
import { subDays } from 'date-fns';
import ContentLoader from 'react-content-loader';
import Error from 'views/misc/Error';

import PageContent from 'components/PageContent';
import PostContent from 'components/PostContent';
import PostFooter from 'components/PostFooter';
import PostSignature from 'components/PostSignature';
import LikeButton from 'views/posts/LikeButton';

const PostList = () => (
  <PageContent>
    <FirestoreCollection
      path="posts"
      sort="createdAt:desc"
      filter={[
        'createdAt',
        '>=',
        Firebase.firestore.Timestamp.fromDate(subDays(new Date(), 7))
      ]}
    >
      {({ error, isLoading, data }) => {
        if (error) return <Error error={error} />;
        if (isLoading) return <FeedContentLoader />;
        if (data.length === 0) return <EmptyPost />;
        return (
          <div>
            {data.map(post => (
              <PostContainer key={post.id}>
                <Link to={`/${post.id}`}>
                  <PostContent>{post.content}</PostContent>
                </Link>
                <PostFooter>
                  <PostSignature>{post.createdByDisplayName}</PostSignature>
                  <LikeButton post={post} />
                </PostFooter>
              </PostContainer>
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
    <rect x="0" y="240" width="40%" height="25" rx="4" ry="4" />
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

const PostContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacings(5)};
`;

export default PostList;
