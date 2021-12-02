import { useEffect, useRef } from 'react';

type WebcamVideoProps = {
  srcObject: MediaStream;
};

export const WebcamVideo = ({ srcObject, ...props }: WebcamVideoProps) => {
  const refVideo = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!refVideo.current) return;
    refVideo.current.srcObject = srcObject;
  }, [srcObject]);

  return <video id="webcamVideo" autoPlay playsInline ref={refVideo} />;
};
