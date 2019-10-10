import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';

const GET_CURRENT_USER = gql`
  {
    me {
      id
      email
      username
    }
  }
`;

const CurrentUser = ({ children, ...rest }) => (
  <Query query={GET_CURRENT_USER} {...rest}>
    {(result, params) => children(result, params)}
  </Query>
);

CurrentUser.propTypes = {
  children: PropTypes.func.isRequired,
};

export default CurrentUser;
export { GET_CURRENT_USER };
