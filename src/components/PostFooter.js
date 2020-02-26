import styled from 'styled-components';

const PostFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const PostFooterRight = styled.div`
  display: flex;
  align-items: center;

  > div {
    margin-right: ${({ theme }) => theme.spacings(5)};
    &:last-of-type {
      margin-right: 0;
    }
  }
`;

export default PostFooter;
