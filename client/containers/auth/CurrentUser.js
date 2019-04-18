import React from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';

const GET_CURRENT_USER = gql`
  {
    me {
      id
      email
      username
    }
  }
`;

const CurrentUser = (props) => (
  <Query {...props} query={GET_CURRENT_USER}>
    {(result) => props.children(result)}
  </Query>
);

CurrentUser.propTypes = {
  children: PropTypes.func.isRequired,
};

export default CurrentUser;
export { GET_CURRENT_USER };
