import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import { Query } from 'react-apollo';
import { Link, FeedContentLoader } from '@components';

const styles = (theme) => ({
  post: {
    position: 'relative',
    display: 'inline',
    color: theme.brand.black,
    borderColor: 'transparent',
    fontSize: 20,
    lineHeight: '32px',
    marginLeft: theme.spacing.unit * 3,
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
    '&::before': {
      content: '"•"',
      color: '#3b475f40',
      position: 'absolute',
      left: -16,
      top: -5,
    },
    '&:first-child': {
      marginLeft: 0,
    },
    '&:first-child::before': {
      content: '""',
    },
  },
});

const GET_FEED = gql`
  {
    feed {
      id
      content
    }
  }
`;

function Feed({ classes }) {
  return (
    <Query query={GET_FEED}>
      {({ loading, error, data }) => {
        if (loading) return <FeedContentLoader />;
        if (error) return `Error! ${error.message}`;
        return data.feed.map((post) => (
          <Link
            key={post.id}
            as={`/p/${post.id}`}
            href={`/post?id=${post.id}`}
            className={classes.post}
          >
            {post.content}
          </Link>
        ));
      }}
    </Query>
  );
}

Feed.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Feed);
