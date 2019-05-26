import { storiesOf } from '@storybook/react';
import React from 'react';
import { Loading, Progress, Box } from '@components';

storiesOf('Components|Feedback|Progress', module).add(
  'Loading Components',
  () => (
    <Box>
      <Box mb={3}>
        <Progress />
      </Box>
      <Box display="flex" justify="center">
        <Loading />
      </Box>
    </Box>
  ),
);
