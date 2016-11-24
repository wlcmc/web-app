import React, { PropTypes } from 'react';
import { FailedIcon } from '../../Icons';

const FailedAvatar = ({
  size = 45,
  borderWidth = 2,
  light = false
}) => (
  <span style={{
    display: 'inline-block',
    background: !light ? 'black' : 'white',
    color: 'gray',
    textAlign: 'center',
    width: size,
    height: size,
    borderStyle: 'solid',
    borderWidth,
    borderColor: !light ? 'transparent' : 'gray',
    lineHeight: `${size - 2 * borderWidth}px`,
    borderRadius: Math.ceil(size / 2),
    fontSize: Math.floor(size / 2)
  }}>
    <FailedIcon />
  </span>
);

FailedAvatar.propTypes = {
  size: PropTypes.number,
  borderWidth: PropTypes.number,
  light: PropTypes.bool
};

export default FailedAvatar;
