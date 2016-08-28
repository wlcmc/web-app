import React, { PropTypes } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'react-bootstrap';
import Icon from 'react-fontawesome';

const RemoveSupervisorButton = ({ onClick, ...props }) => (
  <Button {...props} onClick={onClick} bsStyle='warning' className='btn-flat'>
    <Icon name='user-times' /> <FormattedMessage id='app.groups.removeSupervisorButton' defaultMessage='Remove supervisor' />
  </Button>
);

RemoveSupervisorButton.propTypes = {
  onClick: PropTypes.func.isRequired
};

export default RemoveSupervisorButton;