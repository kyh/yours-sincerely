import styled from 'styled-components';

export const Navigation = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacings(5)} 0;
`;
