import React from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { Link } from '@ysds';
import { GET_CURRENT_USER } from './CurrentUser';

const LOGOUT = gql`
  mutation Logout {
    logout {
      message
    }
  }
`;

function Logout() {
  return (
    <Mutation mutation={LOGOUT} refetchQueries={[{ query: GET_CURRENT_USER }]}>
      {(logout) => (
        <Link href="/" onClick={logout}>
          Logout
        </Link>
      )}
    </Mutation>
  );
}

export default Logout;
