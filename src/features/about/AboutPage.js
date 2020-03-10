import React from 'react';
import styled from 'styled-components';

export const AboutPage = () => (
  <AboutContainer>
    <h1>About</h1>
    <Quote>
      An ephemeral anonymous blog to send each other tiny beautiful letters
    </Quote>
    <Quote>
      YS is a public art project with optional anonymity. It is also a direct
      channel to the inner lives of other humans who, in other contexts, rarely
      reveal such vulnerability
    </Quote>
    <a
      href="https://github.com/tehkaiyu/yours-sincerely/issues/new"
      target="_blank"
      rel="noopener noreferrer"
    >
      What is YS to you?
    </a>
  </AboutContainer>
);

const AboutContainer = styled.section`
  max-width: 400px;
  margin: 0 auto;

  h1 {
    text-align: center;
    font-size: ${({ theme }) => theme.typography.h4.fontSize};
    margin: 0 0 ${({ theme }) => theme.spacings(5)};
  }

  a {
    display: block;
    text-align: center;
    color: ${({ theme }) => theme.colors.primary};
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Quote = styled.p`
  line-height: 1.6;
  margin: 0 0 ${({ theme }) => theme.spacings(10)};
  position: relative;
  &::before {
    content: ' ';
    display: block;
    position: absolute;
    left: -12px;
    top: -4px;
    background-image: url(/assets/quote.svg);
    background-repeat: no-repeat;
    width: 24px;
    height: 18px;
    z-index: -1;
    opacity: 0.25;
  }
`;
