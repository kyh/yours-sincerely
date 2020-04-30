import React from "react";
import styled from "styled-components";

export const PrivacyTerms = () => (
  <Container className="privacy-terms">
    By posting on YS, you agree to our{" "}
    <a
      href="http://https://github.com/tehkaiyu/yours-sincerely/blob/master/.github/PRIVACY.md"
      target="_blank"
      rel="noopener noreferrer"
    >
      Privacy Policy
    </a>{" "}
    and{" "}
    <a
      href="http://https://github.com/tehkaiyu/yours-sincerely/blob/master/.github/TERMS.md"
      target="_blank"
      rel="noopener noreferrer"
    >
      Terms of use
    </a>
  </Container>
);

const Container = styled.section`
  line-height: 1.6;
  font-size: 13px;
  font-style: italic;
  color: ${({ theme }) => theme.colors.grey};

  > a {
    display: inline;
    color: ${({ theme }) => theme.colors.primary};
    &:hover {
      text-decoration: underline;
    }
  }
`;
