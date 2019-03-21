import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Switch from './Switch';

const styles = (theme) => ({
  root: {
    display: 'flex',
  },
  formControl: {},
});

function CheckBoxGroup({
  classes,
  type,
  label,
  helperText,
  controls,
  ...props
}) {
  return (
    <FormControl
      component="fieldset"
      className={classes.formControl}
      {...props}
    >
      <FormLabel component="legend">{label}</FormLabel>
      <FormGroup>
        {controls.map((c) => {
          return (
            <FormControlLabel
              key={c.name}
              control={
                type === 'switch' ? (
                  <Switch
                    name={c.name}
                    checked={c.checked}
                    onChange={c.handleChange}
                    value={c.value}
                  />
                ) : (
                  <Checkbox
                    name={c.name}
                    checked={c.checked}
                    onChange={c.handleChange}
                    value={c.value}
                  />
                )
              }
              label={c.label}
              labelPlacement={c.labelPlacement}
            />
          );
        })}
      </FormGroup>
      <FormHelperText>{helperText}</FormHelperText>
    </FormControl>
  );
}

CheckBoxGroup.propTypes = {
  classes: PropTypes.object.isRequired,
  // TODO: Add props.
};

export default withStyles(styles)(CheckBoxGroup);
