import { storiesOf } from '@storybook/react';
import React from 'react';
import { Box, Flex } from 'reflexbox';

import { Loading, Progress } from '@ysds';

storiesOf('Components|Progress', module).add('Loading Components', () => (
  <Box>
    <Box mb={40}>
      <Progress />
    </Box>
    <Flex justify="center">
      <Loading />
    </Flex>
  </Box>
));
