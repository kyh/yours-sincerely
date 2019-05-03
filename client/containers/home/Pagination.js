import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { withStyles } from '@material-ui/core/styles';
import { Link } from '@components';

const styles = (theme) => ({});

const PAGINATION_QUERY = gql`
  query PAGINATION_QUERY {
    postsConnection {
      aggregate {
        count
      }
    }
  }
`;

function Pagination({ page }) {
  return (
    <Query query={PAGINATION_QUERY}>
      {({ data, loading, error }) => {
        if (loading || error) return null;
        const { count } = data.postsConnection.aggregate;
        const pages = Math.ceil(count / 1);
        return (
          <section>
            {page > 1 && (
              <Link
                prefetch
                href={{
                  pathname: '/',
                  query: { page: page - 1 },
                }}
              >
                Previous Page
              </Link>
            )}
            {page < pages && (
              <Link
                prefetch
                href={{
                  pathname: '/',
                  query: { page: page + 1 },
                }}
              >
                Next Page
              </Link>
            )}
          </section>
        );
      }}
    </Query>
  );
}

Pagination.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Pagination);
