import styled from 'styled-components';
import { Link } from 'react-router-dom';

const InternalLink = styled(Link)`
  color: ${({ theme }) => theme.colors.purple};
  text-decoration: none;

  &:hover,
  &:active {
    text-decoration: underline;
  }
`;
const HeaderLink = styled(Link)`
  color: ${({ theme }) => theme.colors.black};
  text-decoration: none;
  font-size: 1.2rem;
`;

export { InternalLink, HeaderLink };
