import React, { useState } from "react";
import styled from "styled-components";
import { useHistory } from "react-router-dom";

import { Input } from "components/Input";
import { Spinner } from "components/Spinner";
import { logout } from "features/auth/actions/authActions";
import { ProfileDetails } from "./ProfileDetails";

export const Profile = ({ user }) => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);

  const onBlur = async (event) => {
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
      <img src="/assets/dancing.svg" alt="Not logged in" />
      <ProfileForm>
        <InputContainer>
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
          <InputSpinner loading={isLoading} />
        </InputContainer>
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

const InputContainer = styled.div`
  position: relative;
`;

const InputSpinner = styled(Spinner)`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
`;

const NameInput = styled(Input)`
  font-size: 2rem;
  font-weight: 600;
  max-width: 100%;
`;

const ProfileForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;

  .submit {
    margin-top: ${({ theme }) => theme.spacings(3)};
  }
  .logout {
    display: inline-block;
    margin: auto auto 0;
    color: ${({ theme }) => theme.colors.red};
    padding: ${({ theme }) => `${theme.spacings(3)} ${theme.spacings(6)}`};
    border-radius: 4px;
    transition: background 0.23s ease;
    &:hover {
      background: ${({ theme }) => theme.colors.backgroundRed};
    }
    ${({ theme }) => theme.breakpoints.sm`
      margin: ${({ theme }) => theme.spacings(10)} auto;
    `}
  }
`;
