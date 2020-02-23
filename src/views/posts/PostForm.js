// This is an uncontrolled React form, which is way simpler than
// the normal React controlled form
// https://reactjs.org/docs/uncontrolled-components.html
//
// You can use browser form validation these days, and just
// get the values from the form on submit.

import React from 'react';

import { FormRow, FormLabel, TextArea } from 'styles/forms';

class PostForm extends React.Component {
  onSubmit = event => {
    event.preventDefault();
    const { content } = event.target.elements;
    const values = {
      content: content.value
    };
    this.props.onSubmit(values);
  };

  render() {
    return (
      <form onSubmit={this.onSubmit}>
        <FormRow>
          <FormLabel for="content">Content</FormLabel>
          <TextArea
            type="text"
            name="content"
            defaultValue={this.props.post ? this.props.post.content : ''}
            required
          />
        </FormRow>
        <button type="submit">Save post</button>
      </form>
    );
  }
}

export default PostForm;
