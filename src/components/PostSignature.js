import styled from 'styled-components';

const PostSignature = styled.div`
  font-style: italic;
  &::before {
    content: '— ';
  }
`;

export default PostSignature;
