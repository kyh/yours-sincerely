import React from 'react';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import { Mutation } from 'react-apollo';
import { TextField, Button } from '@components';
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
  return (
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
              rows="4"
              margin="normal"
              variant="outlined"
              multiline
              fullWidth
            />
            <Button type="submit">Create</Button>
          </Form>
        </Formik>
      )}
    </Mutation>
  );
};

export default withStyles(styles)(CreateDraft);
