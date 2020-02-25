import styled from 'styled-components';

const PageContainer = styled.section`
  max-width: ${({ theme }) => theme.ui.maxWidth};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacings(12)};
  display: grid;
  grid-template-rows: max-content auto max-content;
  min-height: calc((var(--vh, 1vh) * 100));
  background: ${({ background }) => background || 'transparent'};

  ${({ theme }) => theme.breakpoints.sm`
    padding: 0 ${({ theme }) => theme.spacings(4)};
  `}
`;

export default PageContainer;
