import React from 'react';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import { Query } from 'react-apollo';
import { Text, FeedContentLoader } from '@components';

const styles = {};

const GET_POST = gql`
  query Post($id: ID!) {
    post(id: $id) {
      id
      content
    }
  }
`;

function Post({ classes, postId }) {
  return (
    <Query query={GET_POST} variables={{ id: postId }}>
      {({ loading, error, data }) => {
        console.log(data);
        if (loading) return <FeedContentLoader />;
        if (error) return `Error! ${error.message}`;
        return <Text className={classes.text}>{data.post.content}</Text>;
      }}
    </Query>
  );
}

Post.getInitialProps = ({ query }) => {
  return { postId: query.id };
};

export default withStyles(styles)(Post);
