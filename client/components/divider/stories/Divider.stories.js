import { storiesOf } from '@storybook/react';
import React from 'react';
import { Divider, List, ListItem } from '@components';

storiesOf('Components|Divider', module).add('Divider component', () => (
  <List component="nav">
    <ListItem button primaryText="Inbox" />
    <Divider />
    <ListItem button divider primaryText="Drafts" />
    <ListItem button primaryText="Trash" />
    <Divider light />
    <ListItem button primaryText="Spam" />
  </List>
));
