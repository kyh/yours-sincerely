import styled from 'styled-components';

export const PostSignature = styled.div`
  font-style: italic;
  max-width: 65vw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &::before {
    content: '— ';
    vertical-align: 1px;
    margin-right: 4px;
    display: inline-block;
  }
`;
