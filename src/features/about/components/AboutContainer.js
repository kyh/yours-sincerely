import styled from "styled-components";

export const AboutContainer = styled.section`
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;

  .about-content {
    margin: 0 0 ${({ theme }) => theme.spacings(5)};
  }

  .title {
    text-align: center;
    font-size: ${({ theme }) => theme.typography.h4.fontSize};
    margin: 0 0 ${({ theme }) => theme.spacings(5)};
  }

  .request {
    display: block;
    text-align: center;
    color: ${({ theme }) => theme.colors.primary};
    &:hover {
      text-decoration: underline;
    }
  }

  .privacy-terms {
    margin-top: auto;
  }

  p {
    line-height: 1.6;
    margin-bottom: ${({ theme }) => theme.spacings(5)};
  }

  ul > li {
    margin-bottom: ${({ theme }) => theme.spacings(3)};
  }
`;
