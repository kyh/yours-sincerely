import React from 'react';
import { FirestoreCollection } from 'react-firestore';

import Error from 'views/misc/Error';
import PageContent from 'components/PageContent';

import LikeButton from './LikeButton';

const Post = ({ match }) => (
  <PageContent>
    <FirestoreCollection
      path={'posts'}
      filter={['id', '==', match.params.postId]}
    >
      {({ error, isLoading, data }) => {
        if (error) return <Error error={error} />;
        if (isLoading) return <p>loading...</p>;
        if (data.length === 0) return <Error />;

        const [post] = data;
        return (
          <div>
            <p>{post.content}</p>
            <p>
              {post._likeCount || 0}{' '}
              {post._likeCount && post._likeCount === 1 ? 'like' : 'likes'}{' '}
              <LikeButton post={post} />
            </p>
          </div>
        );
      }}
    </FirestoreCollection>
  </PageContent>
);

export default Post;
