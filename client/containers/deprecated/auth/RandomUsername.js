import React from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';

const GET_RANDOM_USERNAME = gql`
  {
    randomUsername
  }
`;

const RandomUsername = ({ children, ...rest }) => (
  <Query query={GET_RANDOM_USERNAME} {...rest}>
    {(result, params) => children(result, params)}
  </Query>
);

RandomUsername.propTypes = {
  children: PropTypes.func.isRequired,
};

export default RandomUsername;
export { GET_RANDOM_USERNAME };
