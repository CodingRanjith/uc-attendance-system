import React, { forwardRef, useEffect } from 'react';

const CameraView = forwardRef((props, ref) => {
  useEffect(() => {
    if (ref?.current) {
      ref.current.play().catch(err => console.warn('Autoplay failed:', err));
    }
  }, [ref]);

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow mt-4 bg-black">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        className="w-full h-auto object-cover rounded-md"
        style={{ aspectRatio: '4/3', backgroundColor: 'black' }}
      />
    </div>
  );
});

export default CameraView;
