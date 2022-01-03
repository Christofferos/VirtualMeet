import React, { useRef, useEffect } from 'react';
import { CANVAS_WIDTH } from '../utils/constants';

const Canvas = (props: any) => {
  const { draw, state, ...rest } = props;
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = canvas.height = CANVAS_WIDTH;
    let animationFrameId: any;

    const render = () => {
      draw(context, state);
      animationFrameId = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [draw, state]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        borderRadius: '10px',
        marginTop: '150px',
      }}
      {...rest}
    />
  );
};

export default Canvas;
