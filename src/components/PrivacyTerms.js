import React, { useState } from "react";
import styled from "styled-components";
import { Checkbox } from "components/Checkbox";

export const PrivacyTerms = ({
  withCheckbox = false,
  onChecked = () => {},
}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [viewedPrivacy, setViewedPrivacy] = useState(false);
  const [viewedTerms, setViewedTerms] = useState(false);

  const onCheck = () => {
    if (!viewedPrivacy) {
      alert("Please read through the privacy policy");
      return;
    }
    if (!viewedTerms) {
      alert("Please read through the terms of usage");
      return;
    }
    setIsChecked(!isChecked);
    onChecked(!isChecked);
  };

  return (
    <Container className="privacy-terms">
      {withCheckbox && <Checkbox onChange={onCheck} checked={isChecked} />}
      <div>
        By posting on YS, you agree to our{" "}
        <a
          href="https://yourssincerely.org/privacy"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setViewedPrivacy(true)}
        >
          Privacy Policy
        </a>{" "}
        and{" "}
        <a
          href="https://yourssincerely.org/terms"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setViewedTerms(true)}
        >
          Terms of use
        </a>
      </div>
    </Container>
  );
};

const Container = styled.section`
  line-height: 1.6;
  font-size: 13px;
  font-style: italic;
  color: ${({ theme }) => theme.colors.grey};
  display: flex;
  align-items: center;

  a {
    display: inline;
    color: ${({ theme }) => theme.colors.primary};
    &:hover {
      text-decoration: underline;
    }
  }
`;
