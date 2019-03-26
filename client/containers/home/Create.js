import React, { useState } from 'react';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import { Mutation } from 'react-apollo';
import { TextField, Button } from '@components';

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

const CreateDraft = () => {
  const [draft, setDraft] = useState('');
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createDraft({ variables: { content: draft } });
            setDraft('');
          }}
        >
          <TextField
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows="4"
            margin="normal"
            variant="outlined"
            multiline
            fullWidth
          />
          <Button type="submit">Create</Button>
        </form>
      )}
    </Mutation>
  );
};

export default withStyles(styles)(CreateDraft);
