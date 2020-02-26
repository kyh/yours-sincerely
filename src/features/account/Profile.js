import React from 'react';
import { useHistory } from 'react-router-dom';

import { logout } from 'features/misc/actions/authActions';

export const Profile = ({ auth }) => {
  const history = useHistory();
  return (
    <div>
      <img
        src={auth.photoURL}
        alt={auth.displayName}
        width="100"
        height="100"
      />
      <p>
        <strong>{auth.displayName}</strong>
      </p>
      <p>{auth.email}</p>
      <button onClick={() => logout().then(() => history.push(`/`))}>
        log out
      </button>
    </div>
  );
};

export default Profile;
