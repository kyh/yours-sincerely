import styled from 'styled-components';

export const ConnectSection = styled.div`
  display: flex;
  position: relative;
  justify-content: center;
  padding-top: ${({ theme }) => theme.spacings(4)};
  margin-top: ${({ theme }) => theme.spacings(8)};
  border-top: 1px solid ${({ theme }) => theme.ui.border};
  &::before {
    content: '${({ text }) => text}';
    position: absolute;
    top: -7px;
    background: ${({ bg }) => bg || 'white'};
    padding: 0 8px;
    font-size: 0.7rem;
    color: ${({ theme }) => theme.colors.grey};
  }
`;
