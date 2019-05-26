import { storiesOf } from '@storybook/react';
import { State, Store } from '@sambego/storybook-state';
import React from 'react';
import { Menu, MenuItem, Button } from '@components';

const store = new Store({
  open: false,
  anchorEl: null,
});

storiesOf('Components|Navigation|Menu', module).add('Menu component', () => (
  <State store={store}>
    <Button
      aria-owns={store.get('anchorEl') ? 'simple-menu' : undefined}
      aria-haspopup="true"
      onClick={() => store.set({ open: true })}
    >
      Open Menu
    </Button>
    <Menu
      id="simple-menu"
      anchorEl={store.get('anchorEl')}
      open={Boolean(store.get('anchorEl'))}
      onClose={() => store.set({ open: false })}
    >
      <MenuItem onClick={() => store.set({ open: false })}>Profile</MenuItem>
      <MenuItem onClick={() => store.set({ open: false })}>My account</MenuItem>
      <MenuItem onClick={() => store.set({ open: false })}>Logout</MenuItem>
    </Menu>
  </State>
));
