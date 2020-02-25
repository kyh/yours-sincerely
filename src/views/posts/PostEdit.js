import React from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { FirestoreCollection } from 'react-firestore';

import Error from 'views/misc/Error';
import deletePost from 'actions/deletePost';
import updatePost from 'actions/updatePost';
import PageContent from 'components/PageContent';
import PostForm from './PostForm';

const PostEdit = () => {
  const { postId } = useParams();
  const history = useHistory();
  return (
    <PageContent>
      <FirestoreCollection path={'posts'} filter={['id', '==', postId]}>
        {({ error, isLoading, data }) => {
          if (error) return <Error error={error} />;
          if (isLoading) return <p>loading...</p>;
          if (data.length === 0) return <Error />;

          const [post] = data;
          return (
            <div>
              <PostForm
                post={post}
                onSubmit={values =>
                  updatePost(post.id, values).then(() =>
                    history.push(`/${post.id}`)
                  )
                }
              />
              <br />
              <button
                onClick={() => deletePost(post).then(() => history.push(`/`))}
              >
                Delete post
              </button>
            </div>
          );
        }}
      </FirestoreCollection>
    </PageContent>
  );
};

export default PostEdit;
