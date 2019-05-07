import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import { Query } from 'react-apollo';
import { Link, FeedContentLoader } from '@components';
import { perPage } from '@client/utils/constants';

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

const GET_POSTS = gql`
  query GET_POSTS($skip: Int = 0, $first: Int = ${perPage}) {
    posts(first: $first, skip: $skip, orderBy: createdAt_DESC) {
      id
      content
    }
  }
`;

function Feed({ page, classes }) {
  return (
    <Query
      query={GET_POSTS}
      // fetchPolicy="network-only"
      variables={{
        skip: page * perPage - perPage,
      }}
    >
      {({ loading, error, data }) => {
        if (loading) return <FeedContentLoader />;
        if (error) return `Error! ${error.message}`;
        return data.posts.map((post) => (
          <Link
            key={post.id}
            as={`/p/${post.id}`}
            href={{
              pathname: 'post',
              query: { id: post.id },
            }}
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
export { GET_POSTS };
