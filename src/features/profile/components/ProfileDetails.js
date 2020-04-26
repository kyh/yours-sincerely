import styled from "styled-components";

export const ProfileDetails = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  img {
    max-width: 300px;
  }
  a {
    color: ${({ theme }) => theme.colors.primary};
    &:hover {
      text-decoration: underline;
    }
  }
  ${({ theme }) => theme.breakpoints.sm`
    justify-items: center;
    text-align: center;
  `}
`;
