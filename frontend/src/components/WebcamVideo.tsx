import { useEffect, useRef } from 'react';

type WebcamVideoProps = {
  srcObject: MediaStream;
  id: string;
};

export const WebcamVideo = ({ srcObject, id, ...props }: WebcamVideoProps) => {
  const refVideo = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!refVideo.current) return;
    refVideo.current.srcObject = srcObject;
  }, [srcObject]);

  return <video autoPlay playsInline ref={refVideo} id={id} />;
};
