import React, { forwardRef } from 'react';

const CameraView = forwardRef((props, ref) => (
  <video
    ref={ref}
    autoPlay
    playsInline
    muted
    className="w-full h-64 rounded-xl bg-black object-cover"
  />
));

export default CameraView;
