import React from 'react';
import styled from 'styled-components';

const PostForm = ({ post, onSubmit }) => {
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
        <button type="submit">Save post</button>
      </SubmitContainer>
      <Textarea
        type="text"
        name="content"
        defaultValue={post ? post.content : ''}
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
  padding: 0 0 20px;
  resize: none;
  outline: none;
`;

const SubmitContainer = styled.header`
  position: absolute;
  top: -60px;
  right: 0;
  display: flex;
  flex-direction: row-reverse;
`;

export default PostForm;
