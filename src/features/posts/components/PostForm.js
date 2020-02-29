import React from 'react';
import styled from 'styled-components';
import { Button } from 'components/Button';
import { addDays, format } from 'date-fns';

export const PostForm = ({ postingAs, post, onSubmit, isSubmitting }) => {
  const expiry = addDays(new Date(), 7);
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
      <Textarea
        type="text"
        name="content"
        defaultValue={post ? post.content : ''}
        placeholder="Hello in there?"
        autoFocus
        required
      />
      <SubmitContainer>
        <PostDetails>
          <span className="posting-as">
            {postingAs
              ? `Publishing as: ${postingAs}`
              : 'Publishing anonymously'}
          </span>
          <span className="expiry">
            This post will expire on {format(expiry, 'MMMM do')}
          </span>
        </PostDetails>
        <Button type="submit" disabled={isSubmitting}>
          Publish
        </Button>
      </SubmitContainer>
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
  padding: ${({ theme }) => theme.spacings(6)} 0 80px;
  font-size: ${({ theme }) => theme.typography.post.fontSize};
  line-height: ${({ theme }) => theme.typography.post.lineHeight};
`;

const SubmitContainer = styled.section`
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PostDetails = styled.div`
  span {
    display: block;
    font-size: 0.8rem;
  }
  .posting-as {
    margin-bottom: ${({ theme }) => theme.spacings(2)};
  }
  .expiry {
    color: #919294;
  }
`;
