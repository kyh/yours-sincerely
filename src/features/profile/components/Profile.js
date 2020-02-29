import React, { useState } from 'react';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';

import { Input } from 'components/Input';
import { logout } from 'features/auth/actions/authActions';
import { ProfileDetails } from './ProfileDetails';

export const Profile = ({ user }) => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);

  const onBlur = async event => {
    const name = event.target.value;
    event.preventDefault();
    if (name && name !== user.displayName) {
      setIsLoading(true);
      await user.updateProfile({ displayName: name });
      setIsLoading(false);
    }
  };

  return (
    <ProfileDetails>
      <img src="/assets/reading.svg" alt="Not logged in" />
      <ProfileForm>
        <NameInput
          type="text"
          id="name"
          name="name"
          placeholder="Bojack the horse"
          disabled={isLoading}
          defaultValue={user.displayName}
          onBlur={onBlur}
          required
        />
        <button
          type="button"
          className="logout"
          disabled={isLoading}
          onClick={() => logout().then(() => history.push(`/`))}
        >
          Log out
        </button>
      </ProfileForm>
    </ProfileDetails>
  );
};

const NameInput = styled(Input)`
  font-size: 2rem;
  font-weight: 600;
  max-width: 100%;
`;

const ProfileForm = styled.form`
  display: flex;
  flex-direction: column;

  .submit {
    margin-top: ${({ theme }) => theme.spacings(3)};
  }
  .logout {
    color: ${({ theme }) => theme.colors.red};
    margin-top: auto;
  }
`;
