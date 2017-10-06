import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { FormGroup, HelpBlock, Checkbox } from 'react-bootstrap';

import OnOffCheckbox from '../OnOffCheckbox';

const CheckboxField = ({
  input,
  onOff = false,
  meta: { touched, error },
  label,
  ...props
}) => {
  const Component = onOff ? OnOffCheckbox : Checkbox;
  /* eslint-disable no-unneeded-ternary */
  return (
    <FormGroup
      validationState={error ? (touched ? 'error' : 'warning') : undefined}
      controlId={input.name}
    >
      <Component {...props} {...input} checked={input.value ? true : false}>
        {label}
      </Component>
      {error &&
        <HelpBlock>
          {' '}{touched
            ? error
            : <FormattedMessage
                defaultMessage="This field is required."
                id="app.field.isRequired"
              />}{' '}
        </HelpBlock>}
    </FormGroup>
  );
};

CheckboxField.propTypes = {
  input: PropTypes.shape({
    name: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.bool, PropTypes.string])
  }).isRequired,
  meta: PropTypes.object.isRequired,
  type: PropTypes.string,
  onOff: PropTypes.bool,
  label: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({ type: PropTypes.oneOf([FormattedMessage]) })
  ]).isRequired
};

export default CheckboxField;
