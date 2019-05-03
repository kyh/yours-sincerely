import { storiesOf } from '@storybook/react';
import React from 'react';
import { Chip } from '@ysds';

storiesOf('Components|Chip', module).add('Chip component', () => (
  <div>
    <Chip label="Basic Chip" />
  </div>
));
