import { storiesOf } from '@storybook/react';
import React from 'react';
import { Chip } from '@components';

storiesOf('Components|Data Display|Chip', module).add('Chip component', () => (
  <div>
    <Chip label="Basic Chip" />
  </div>
));
