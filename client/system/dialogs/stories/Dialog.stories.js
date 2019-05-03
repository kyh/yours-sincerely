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
} from '@ysds';

const emails = ['username@gmail.com', 'user02@gmail.com'];

const store = new Store({
  isOpen: false,
});

storiesOf('Components|Dialog', module)
  .add('Basic Popup Dialog', () => (
    <State store={store}>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => store.set({ isOpen: true })}
      >
        Open popup dialog
      </Button>
      <PopupDialog
        onClose={() => store.set({ isOpen: false })}
        title="Select account"
      >
        <List>
          {emails.map((email) => (
            <ListItem
              button
              primaryText={email}
              onClick={() => store.set({ isOpen: false })}
              key={email}
            />
          ))}
          <ListItem
            button
            primaryText="Add new account"
            onClick={() => store.set({ isOpen: false })}
          />
        </List>
      </PopupDialog>
    </State>
  ))
  .add('Fullscreen Dialog', () => (
    <State store={store}>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => store.set({ isOpen: true })}
      >
        Open fullscreen dialog
      </Button>
      <Dialog
        onClose={() => store.set({ isOpen: false })}
        title="Select account"
      >
        <List>
          {emails.map((email) => (
            <ListItem
              button
              primaryText={email}
              onClick={() => store.set({ isOpen: false })}
              key={email}
            />
          ))}
          <ListItem
            button
            primaryText="Add new account"
            onClick={() => store.set({ isOpen: false })}
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
        onClick={() => store.set({ isOpen: true })}
      >
        Open confirmation dialog
      </Button>
      <AlertDialog
        onClose={() => store.set({ isOpen: false })}
        title="Use Google's location service?"
        content="Let Google help apps determine location. This means sending anonymous
          location data to Google, even when no apps are running."
      />
    </State>
  ));
