import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Slide from '@material-ui/core/Slide';
import ArrowBack from '@material-ui/icons/ArrowBack';

const styles = {
  appBar: {
    position: 'relative',
    backgroundColor: 'transparent',
    boxShadow: 'none',
    minHeight: 50,
  },
  toolBar: {
    padding: 0,
    display: 'flex',
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
  },
};

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

function YSDialog({
  children,
  isOpen,
  onClose,
  title,
  rightButton,
  classes,
  ...props
}) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      TransitionComponent={Transition}
      {...props}
    >
      <AppBar className={classes.appBar}>
        <Toolbar className={classes.toolBar}>
          <IconButton color="secondary" onClick={onClose} aria-label="Close">
            <ArrowBack />
          </IconButton>
          {!!title && (
            <Typography variant="h6" color="secondary" className={classes.flex}>
              {title}
            </Typography>
          )}
          {!!rightButton && rightButton}
        </Toolbar>
      </AppBar>
      {children}
    </Dialog>
  );
}

export default withStyles(styles)(YSDialog);
