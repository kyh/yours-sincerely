import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import { Query } from 'react-apollo';
import { Text, FeedContentLoader } from '@components';

const styles = {};

const GET_FEED = gql`
  {
    feed {
      id
      content
    }
  }
`;

function Feed() {
  return (
    <Query query={GET_FEED}>
      {({ loading, error, data }) => {
        if (loading) return <FeedContentLoader />;
        if (error) return `Error! ${error.message}`;
        return data.feed.map((post) => (
          <Text key={post.id} component="span">
            {post.content}
          </Text>
        ));
      }}
    </Query>
  );
}

Feed.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Feed);
