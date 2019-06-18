import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Feed from '@client/containers/home/Feed';
import { Link, FeedContentLoader } from '@components';

const styles = (theme) => ({
  post: {
    position: 'relative',
    display: 'inline',
    color: theme.brand.black,
    borderColor: 'transparent',
    fontSize: 20,
    lineHeight: '32px',
    marginLeft: theme.spacing(3),
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

function FeedContent({ currentPage, classes }) {
  return (
    <Feed currentPage={currentPage}>
      {({ loading, error, data }) => {
        if (loading) return <FeedContentLoader />;
        if (error) return `Error! ${error.message}`;
        return data.posts.map((post) => (
          <Link
            key={post.id}
            as={`/p/${post.id}`}
            href={`/post/?id=${post.id}`}
            className={classes.post}
          >
            {post.content}
          </Link>
        ));
      }}
    </Feed>
  );
}

FeedContent.propTypes = {
  classes: PropTypes.object.isRequired,
  currentPage: PropTypes.number.isRequired,
};

export default withStyles(styles)(FeedContent);
