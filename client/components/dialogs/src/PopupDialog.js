import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';

function CgPopupDialog({
  children,
  isOpen,
  onClose,
  title,
  rightButton,
  classes,
  ...props
}) {
  return (
    <Dialog open={isOpen} onClose={onClose} {...props}>
      {title && <DialogTitle>{title}</DialogTitle>}
      {children}
    </Dialog>
  );
}

export default CgPopupDialog;
