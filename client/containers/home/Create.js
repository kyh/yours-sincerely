import React, { useState } from 'react';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import { Mutation } from 'react-apollo';
import { TextField, Dialog, Button } from '@components';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

const styles = {};

const CREATE_DRAFT = gql`
  mutation CreateDraft($content: String!) {
    createDraft(content: $content) {
      id
      content
    }
  }
`;

const GET_FEED = gql`
  {
    feed {
      id
      content
    }
  }
`;

const validationSchema = Yup.object().shape({
  content: Yup.string()
    .max(500, 'For now, we only allow short stories')
    .required("Don't forget the details"),
});

const CreateDraft = () => {
  const [isOpen, toggleOpen] = useState(false);
  return (
    <>
      <TextField
        name="content"
        margin="normal"
        variant="outlined"
        fullWidth
        defaultField
        placeholder="Continue the story..."
        InputProps={{
          readOnly: true,
        }}
        onClick={() => toggleOpen(!isOpen)}
      />
      <Dialog isOpen={isOpen} onClose={() => toggleOpen(!isOpen)}>
        <Mutation
          mutation={CREATE_DRAFT}
          update={(cache, { data: { createDraft } }) => {
            const { posts } = cache.readQuery({ query: GET_FEED });
            cache.writeQuery({
              query: GET_FEED,
              data: { posts: posts.concat([createDraft]) },
            });
          }}
        >
          {(createDraft) => (
            <Formik
              initialValues={{ content: '' }}
              validationSchema={validationSchema}
              onSubmit={(values) => {
                createDraft({ variables: values });
              }}
            >
              <Form autoComplete="off">
                <TextField
                  name="content"
                  margin="normal"
                  variant="outlined"
                  fullWidth
                  autoFocus
                />
              </Form>
            </Formik>
          )}
        </Mutation>
      </Dialog>
    </>
  );
};

export default withStyles(styles)(CreateDraft);
