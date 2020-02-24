import React from 'react';
import styled from 'styled-components';
import Button from 'components/Button';

const PostForm = ({ post, onSubmit, isSubmitting }) => {
  const submit = event => {
    event.preventDefault();
    const { content } = event.target.elements;
    const values = {
      content: content.value
    };
    onSubmit(values);
  };

  return (
    <Form onSubmit={submit}>
      <SubmitContainer>
        <Button type="submit" disabled={isSubmitting}>
          Make Post
        </Button>
      </SubmitContainer>
      <Textarea
        type="text"
        name="content"
        defaultValue={post ? post.content : ''}
        placeholder="Hello in there?"
        autoFocus
        required
      />
    </Form>
  );
};

const Form = styled.form`
  position: relative;
`;

const Textarea = styled.textarea`
  width: 100%;
  height: 100%;
  border: none;
  resize: none;
  outline: none;
  padding: ${({ theme }) => theme.spacings(6)} 0;
  font-size: ${({ theme }) => theme.typography.post.fontSize};
  line-height: ${({ theme }) => theme.typography.post.lineHeight};
`;

const SubmitContainer = styled.header`
  position: absolute;
  top: -68px;
  right: 0;
  display: flex;
  flex-direction: row-reverse;
`;

export default PostForm;
