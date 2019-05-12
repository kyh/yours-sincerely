import React from 'react';
import PropTypes from 'prop-types';
import TextField from './TextField';

function FormField({ id, className, label, value, formikProps, ...props }) {
  const { errors, touched, handleChange, setFieldTouched } = formikProps;
  return (
    <TextField
      id={id}
      name={id}
      label={label}
      className={className}
      helperText={touched[id] ? errors[id] : ''}
      error={touched[id] && Boolean(errors[id])}
      value={value}
      onChange={(e) => {
        e.persist();
        handleChange(e);
      }}
      onBlur={() => setFieldTouched(id, true, false)}
      {...props}
    />
  );
}

FormField.propTypes = {
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.string,
  formikProps: PropTypes.object.isRequired,
};

export default React.memo(FormField);
