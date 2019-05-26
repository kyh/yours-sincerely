import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';

function YSPopupDialog({
  children,
  open,
  onClose,
  title,
  rightButton,
  classes,
  ...props
}) {
  return (
    <Dialog open={open} onClose={onClose} {...props}>
      {title && <DialogTitle>{title}</DialogTitle>}
      {children}
    </Dialog>
  );
}

export default YSPopupDialog;
