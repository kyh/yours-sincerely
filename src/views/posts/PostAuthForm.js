import React, { useState } from 'react';
import styled from 'styled-components';
import logIn, { loginTypes } from 'actions/logIn';
import Button from 'components/Button';
import Input from 'components/Input';

const PostAuthForm = ({ onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);

  const anonymousLogin = async event => {
    setIsLoading(true);
    event.preventDefault();
    const { name } = event.target.elements;
    const { user } = await logIn(loginTypes.anonymous);
    await user.updateProfile({ displayName: name.value });
    return onSubmit();
  };

  return (
    <PostAuthFormContainer onSubmit={anonymousLogin}>
      <NameContainer>
        <p>
          Duh, back in the '90s I was on a very famous TV show. <br />
          I'm{' '}
          <Input
            type="text"
            name="name"
            placeholder="Bojack the horse"
            disabled={isLoading}
            required
          />
        </p>
        <Button type="submit" disabled={isLoading}>
          Now publish my post
        </Button>
      </NameContainer>
      <ConnectContainer>
        <button type="button" onClick={() => logIn(loginTypes.google)}>
          <img src="/assets/google-button.svg" alt="Sign in with Google" />
        </button>
      </ConnectContainer>
    </PostAuthFormContainer>
  );
};

const PostAuthFormContainer = styled.form`
  padding: ${({ theme }) => `0 ${theme.spacings(5)} 140px`};
  &::before,
  &::after {
    content: '';
    display: block;
    position: absolute;
    height: 160px;
    width: 50%;
    bottom: 0;
    background-size: cover;
    background-repeat: no-repeat;
    pointer-events: none;
    opacity: 0.1;
  }

  &::before {
    left: 0;
    background-image: url(/assets/bikini.svg);
    background-position: -40px 15px;
  }

  &:after {
    right: 0;
    background-image: url('/assets/zombieing.svg');
    background-position: -20px -10px;
    transform: scaleX(-1);
  }
`;

const NameContainer = styled.div`
  background: ${({ theme }) => theme.ui.background};
  border-radius: 10px;
  padding: ${({ theme }) => theme.spacings(5)};
  display: flex;
  flex-direction: column;
  align-items: center;
  p {
    font-size: 1.1rem;
    line-height: 1.8;
    margin-bottom: ${({ theme }) => theme.spacings(7)};
  }
  button {
    max-width: 200px;
  }
`;

const ConnectContainer = styled.div`
  display: flex;
  position: relative;
  justify-content: center;
  padding-top: ${({ theme }) => theme.spacings(4)};
  margin-top: ${({ theme }) => theme.spacings(8)};
  border-top: 1px solid ${({ theme }) => theme.ui.border};
  &::before {
    content: 'Or connect your account';
    position: absolute;
    top: -7px;
    background: white;
    padding: 0 8px;
    font-size: 0.7rem;
    color: ${({ theme }) => theme.colors.grey};
  }
`;

export default PostAuthForm;
