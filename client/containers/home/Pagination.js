import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Link } from '@components';

const styles = (theme) => ({});

function Pagination({ page }) {
  return (
    <>
      <Link
        prefetch
        href={{
          pathname: '/',
          query: { page: page - 1 },
        }}
      >
        Previous
      </Link>
      <Link
        prefetch
        href={{
          pathname: '/',
          query: { page: page + 1 },
        }}
      >
        Next
      </Link>
    </>
  );
}

Pagination.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Pagination);
