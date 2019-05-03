import { storiesOf } from '@storybook/react';
import React from 'react';
import { Flex, Box } from 'reflexbox';

import { Tooltip, Button } from '@components';

storiesOf('Components|Tooltip', module).add('Tooltip component', () => (
  <Flex justify="center" style={{ maxWidth: 700, margin: '100px auto' }}>
    <Flex justify="center">
      <Box>
        <Tooltip title="Add" placement="top-start">
          <Button>top-start</Button>
        </Tooltip>
        <Tooltip title="Add" placement="top">
          <Button>top</Button>
        </Tooltip>
        <Tooltip title="Add" placement="top-end">
          <Button>top-end</Button>
        </Tooltip>
      </Box>
    </Flex>
    <Flex justify="center">
      <Flex>
        <Tooltip title="Add" placement="left-start">
          <Button>left-start</Button>
        </Tooltip>
        <br />
        <Tooltip title="Add" placement="left">
          <Button>left</Button>
        </Tooltip>
        <br />
        <Tooltip title="Add" placement="left-end">
          <Button>left-end</Button>
        </Tooltip>
      </Flex>
      <Flex align="flex-end" column>
        <Box>
          <Tooltip title="Add" placement="right-start">
            <Button>right-start</Button>
          </Tooltip>
        </Box>
        <Box>
          <Tooltip title="Add" placement="right">
            <Button>right</Button>
          </Tooltip>
        </Box>
        <Box>
          <Tooltip title="Add" placement="right-end">
            <Button>right-end</Button>
          </Tooltip>
        </Box>
      </Flex>
    </Flex>
    <Flex justify="center">
      <Box>
        <Tooltip title="Add" placement="bottom-start">
          <Button>bottom-start</Button>
        </Tooltip>
        <Tooltip title="Add" placement="bottom">
          <Button>bottom</Button>
        </Tooltip>
        <Tooltip title="Add" placement="bottom-end">
          <Button>bottom-end</Button>
        </Tooltip>
      </Box>
    </Flex>
  </Flex>
));
