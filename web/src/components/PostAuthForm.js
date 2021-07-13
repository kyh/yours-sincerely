import { useState } from "react";
import Image from "next/image";
import styled from "styled-components";
import { Button } from "components/Button";
import { Input } from "components/Input";
import { ConnectSection } from "components/ConnectSection";
import { PrivacyTerms } from "components/PrivacyTerms";
import { isIOS } from "util/platform";
import { useAuth } from "actions/auth";

export const PostAuthForm = ({ onSubmit }) => {
  const { signinWithProvider, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(!isIOS());

  const anonymousLogin = async (event) => {
    setIsLoading(true);
    event.preventDefault();
    const { name } = event.target.elements;
    await signinWithProvider();
    await updateProfile({ displayName: name.value });
    return onSubmit();
  };

  const googleLogin = () => {
    signinWithProvider("google");
  };

  return (
    <PostAuthFormContainer onSubmit={anonymousLogin}>
      <NameContainer>
        <p>
          Duh, back in the '90s I was on a very famous TV show. <br />
          I'm{" "}
          <Input
            type="text"
            name="name"
            placeholder="Bojack the horse"
            disabled={isLoading}
            required
          />
        </p>
        <Button type="submit" disabled={!isChecked || isLoading}>
          Now publish my post
        </Button>
      </NameContainer>
      {isIOS() ? (
        <PrivacyTerms withCheckbox onChecked={(c) => setIsChecked(c)} />
      ) : (
        <ConnectSection text="Or connect your account">
          <button type="button" onClick={googleLogin}>
            <Image
              src="/assets/google-button.svg"
              alt="Sign in with Google"
              width={195}
              height={50}
            />
          </button>
        </ConnectSection>
      )}
    </PostAuthFormContainer>
  );
};

const PostAuthFormContainer = styled.form`
  padding: ${({ theme }) => `0 ${theme.spacings(5)} 140px`};

  .privacy-terms {
    display: flex;
    justify-content: center;
    margin-top: ${({ theme }) => theme.spacings(4)};
  }

  &::before,
  &::after {
    content: "";
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
    background-image: url("/assets/zombieing.svg");
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
