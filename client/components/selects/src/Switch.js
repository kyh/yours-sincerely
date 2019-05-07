import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Switch from '@material-ui/core/Switch';

const styles = (theme) => ({
  switchBase: {
    '&$checked': {
      color: theme.palette.common.white,
      '& + $bar': {
        backgroundColor: '#52d869',
      },
    },
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
      easing: theme.transitions.easing.sharp,
    }),
  },
  checked: {
    transform: 'translateX(15px)',
    '& + $bar': {
      opacity: 1,
      border: 'none',
    },
  },
  bar: {
    borderRadius: 13,
    width: 42,
    height: 26,
    marginTop: -13,
    marginLeft: -21,
    border: 'solid 1px',
    borderColor: theme.palette.grey[400],
    backgroundColor: theme.palette.grey[50],
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'border']),
  },
  icon: {
    width: 24,
    height: 24,
  },
  iconChecked: {
    boxShadow: theme.shadows[1],
  },
});

export default React.memo(withStyles(styles)(Switch));
