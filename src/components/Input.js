import styled from 'styled-components';

const Input = styled.input`
  border: none;
  background: transparent;
  border-bottom: 1px dashed ${({ theme }) => theme.colors.secondary};
  border-radius: 4px;
  font-size: 1rem;
  padding: ${({ theme }) => theme.spacings(3)};
  transition: 0.2s ease;

  &:focus {
    outline: none;
    background: ${({ theme }) => theme.ui.border};
  }
`;

export default Input;
