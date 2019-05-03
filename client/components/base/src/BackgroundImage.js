import React from 'react';

const BackgroundImage = ({ image, hidden, transparent, style }) => {
  return (
    <div
      style={{
        backgroundImage: `url('${image}')`,
        position: 'absolute',
        left: 0,
        right: 0,
        top: -22,
        width: '100%',
        height: '100%',
        backgroundSize: '100%',
        opacity: hidden ? 0 : transparent ? 0.3 : 1,
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
};

export default BackgroundImage;
