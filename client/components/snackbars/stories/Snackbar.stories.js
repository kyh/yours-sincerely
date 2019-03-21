import { storiesOf } from '@storybook/react';
import React from 'react';
import { Snackbar } from '@components';

storiesOf('Components|Snackbar', module).add('Snackbar component', () => (
  <div>
    <Snackbar isOpen />
  </div>
));
