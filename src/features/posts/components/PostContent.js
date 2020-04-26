import styled from "styled-components";

export const PostContent = styled.p`
  font-size: ${({ theme }) => theme.typography.post.fontSize};
  line-height: ${({ theme }) => theme.typography.post.lineHeight};
  white-space: pre-wrap;
`;
