import React from 'react';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import { Query } from 'react-apollo';
import { Text, FeedContentLoader } from '@ysds';

const styles = {};

const GET_POST = gql`
  query Post($id: ID!) {
    post(where: { id: $id }) {
      id
      content
    }
  }
`;

function Post({ classes, postId }) {
  return (
    <Query query={GET_POST} variables={{ id: postId }}>
      {({ loading, error, data }) => {
        if (loading) return <FeedContentLoader />;
        if (error) return <Text>Error: {error.message}</Text>;
        if (!data.post) return <Text>No Post Found for {postId}</Text>;
        return <Text className={classes.text}>{data.post.content}</Text>;
      }}
    </Query>
  );
}

Post.getInitialProps = ({ query }) => {
  return { postId: query.id };
};

export default withStyles(styles)(Post);
