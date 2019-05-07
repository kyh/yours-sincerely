import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { Link } from '@components';

const PAGINATION_QUERY = gql`
  query PAGINATION_QUERY {
    postsConnection {
      aggregate {
        count
      }
    }
  }
`;

function Pagination({ currentPage, totalPages }) {
  return (
    <>
      {currentPage > 1 ? (
        <Link
          prefetch
          href={{
            pathname: '/',
            query: { page: currentPage - 1 },
          }}
        >
          « Previous Page
        </Link>
      ) : (
        <span />
      )}
      {currentPage < totalPages ? (
        <Link
          prefetch
          href={{
            pathname: '/',
            query: { page: currentPage + 1 },
          }}
        >
          Next Page »
        </Link>
      ) : (
        <span />
      )}
    </>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
};

export default Pagination;
export { PAGINATION_QUERY };
