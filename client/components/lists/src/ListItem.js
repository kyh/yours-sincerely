import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';

const styles = {
  icon: {
    margin: 0,
  },
};

function YSListItem({
  classes,
  icon,
  primaryText,
  secondaryText,
  secondaryAction,
  ...props
}) {
  return (
    <ListItem {...props}>
      {!!icon && <ListItemIcon className={classes.icon}>{icon}</ListItemIcon>}
      <ListItemText primary={primaryText} secondary={secondaryText || null} />
      {!!secondaryAction && (
        <ListItemSecondaryAction>{secondaryAction}</ListItemSecondaryAction>
      )}
    </ListItem>
  );
}

export default withStyles(styles)(YSListItem);
