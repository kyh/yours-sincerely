import { storiesOf } from '@storybook/react';
import { State, Store } from '@sambego/storybook-state';
import React from 'react';
import {
  PopupDialog,
  AlertDialog,
  Dialog,
  List,
  ListItem,
  Button,
} from '@components';

const emails = ['username@gmail.com', 'user02@gmail.com'];

const store = new Store({
  open: false,
});

storiesOf('Components|Data Display|Dialog', module)
  .add('Basic Popup Dialog', () => (
    <State store={store}>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => store.set({ open: true })}
      >
        Open popup dialog
      </Button>
      <PopupDialog
        onClose={() => store.set({ open: false })}
        title="Select account"
      >
        <List>
          {emails.map((email) => (
            <ListItem
              button
              primaryText={email}
              onClick={() => store.set({ open: false })}
              key={email}
            />
          ))}
          <ListItem
            button
            primaryText="Add new account"
            onClick={() => store.set({ open: false })}
            key="add-account"
          />
        </List>
      </PopupDialog>
    </State>
  ))
  .add('Large Dialog', () => (
    <State store={store}>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => store.set({ open: true })}
      >
        Open Large dialog
      </Button>
      <Dialog onClose={() => store.set({ open: false })} title="Select account">
        <List>
          {emails.map((email) => (
            <ListItem
              button
              primaryText={email}
              onClick={() => store.set({ open: false })}
              key={email}
            />
          ))}
          <ListItem
            button
            primaryText="Add new account"
            onClick={() => store.set({ open: false })}
            key="add-account"
          />
        </List>
      </Dialog>
    </State>
  ))
  .add('Alert/Confirmation Dialog', () => (
    <State store={store}>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => store.set({ open: true })}
      >
        Open confirmation dialog
      </Button>
      <AlertDialog
        onClose={() => store.set({ open: false })}
        title="Use Google's location service?"
        content="Let Google help apps determine location. This means sending anonymous
          location data to Google, even when no apps are running."
      />
    </State>
  ));
