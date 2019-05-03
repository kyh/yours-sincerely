import React from 'react';
import { storiesOf } from '@storybook/react';
import { State, Store } from '@sambego/storybook-state';
import { Button, IconButton, Fab } from '@components';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';

const store = new Store({
  isLoading: false,
});

storiesOf('Components|Buttons', module).add('Button component', () => (
  <div>
    <div>
      <Button variant="contained" style={{ margin: 10 }}>
        Default
      </Button>
      <Button variant="contained" color="primary" style={{ margin: 10 }}>
        Primary
      </Button>
      <Button variant="contained" color="secondary" style={{ margin: 10 }}>
        Secondary
      </Button>
      <Button
        variant="contained"
        color="secondary"
        disabled
        style={{ margin: 10 }}
      >
        Disabled
      </Button>
      <Button
        variant="contained"
        href="#contained-buttons"
        style={{ margin: 10 }}
      >
        Link
      </Button>
      <input
        accept="image/*"
        id="contained-button-file"
        multiple
        type="file"
        style={{ display: 'none' }}
      />
      <label htmlFor="contained-button-file">
        <Button variant="contained" component="span">
          Upload
        </Button>
      </label>
    </div>
    <div>
      <Button size="small" style={{ margin: 10 }}>
        Small
      </Button>
      <Button size="medium" style={{ margin: 10 }}>
        Medium
      </Button>
      <Button size="large" style={{ margin: 10 }}>
        Large
      </Button>
    </div>
    <div>
      <Button
        variant="outlined"
        size="small"
        color="primary"
        style={{ margin: 10 }}
      >
        Small
      </Button>
      <Button
        variant="outlined"
        size="medium"
        color="primary"
        style={{ margin: 10 }}
      >
        Medium
      </Button>
      <Button
        variant="outlined"
        size="large"
        color="primary"
        style={{ margin: 10 }}
      >
        Large
      </Button>
    </div>
    <div>
      <Button
        variant="contained"
        size="small"
        color="primary"
        style={{ margin: 10 }}
      >
        Small
      </Button>
      <Button
        variant="contained"
        size="medium"
        color="primary"
        style={{ margin: 10 }}
      >
        Medium
      </Button>
      <Button
        variant="contained"
        size="large"
        color="primary"
        style={{ margin: 10 }}
      >
        Large
      </Button>
    </div>
    <div>
      <Fab
        size="small"
        color="secondary"
        aria-label="Add"
        style={{ margin: 10 }}
      >
        <AddIcon />
      </Fab>
      <Fab
        size="medium"
        color="secondary"
        aria-label="Add"
        style={{ margin: 10 }}
      >
        <AddIcon />
      </Fab>
      <Fab color="secondary" aria-label="Add" style={{ margin: 10 }}>
        <AddIcon />
      </Fab>
    </div>
    <div>
      <Fab
        variant="extended"
        size="small"
        color="primary"
        aria-label="Add"
        style={{ margin: 10 }}
      >
        <AddIcon />
        Extended
      </Fab>
      <Fab
        variant="extended"
        size="medium"
        color="primary"
        aria-label="Add"
        style={{ margin: 10 }}
      >
        <AddIcon />
        Extended
      </Fab>
      <Fab
        variant="extended"
        color="primary"
        aria-label="Add"
        style={{ margin: 10 }}
      >
        <AddIcon />
        Extended
      </Fab>
    </div>
    <div>
      <IconButton aria-label="Delete" style={{ margin: 10 }}>
        <DeleteIcon fontSize="small" />
      </IconButton>
      <IconButton aria-label="Delete" style={{ margin: 10 }}>
        <DeleteIcon />
      </IconButton>
      <IconButton aria-label="Delete" style={{ margin: 10 }}>
        <DeleteIcon fontSize="large" />
      </IconButton>
    </div>
    <div>
      <State store={store}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            store.set({ isLoading: true });
            setTimeout(() => store.set({ isLoading: false }), 3000);
          }}
          style={{ margin: 5 }}
        >
          Loading
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            store.set({ isLoading: true });
            setTimeout(() => store.set({ isLoading: false }), 3000);
          }}
          style={{ margin: 5 }}
        >
          Loading
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            store.set({ isLoading: true });
            setTimeout(() => store.set({ isLoading: false }), 3000);
          }}
          style={{ margin: 5 }}
        >
          Loading
        </Button>
      </State>
    </div>
    <div style={{ marginTop: 15 }}>
      <Button variant="contained" color="primary" fullWidth>
        Full Width Button
      </Button>
    </div>
  </div>
));
