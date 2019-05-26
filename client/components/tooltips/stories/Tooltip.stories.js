import { storiesOf } from '@storybook/react';
import React from 'react';
import { Tooltip, Button, Box } from '@components';

storiesOf('Components|Data Display|Tooltip', module).add(
  'Tooltip component',
  () => (
    <Box
      justifyContentContent="center"
      style={{ maxWidth: 700, margin: '100px auto' }}
    >
      <Box justifyContent="center">
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
      </Box>
      <Box justifyContent="center">
        <Box>
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
        </Box>
        <Box alignItems="flex-end">
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
        </Box>
      </Box>
      <Box justifyContent="center">
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
      </Box>
    </Box>
  ),
);
