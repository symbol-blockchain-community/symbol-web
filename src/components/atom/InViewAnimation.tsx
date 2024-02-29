import Fade from '@mui/material/Fade';
import Slide from '@mui/material/Slide';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface Props {
  direction?: 'up' | 'down' | 'left' | 'right';
  threshold?: number;
  timeout?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}
export default function InViewAnimation(props: Props): JSX.Element {
  const { ref, inView } = useInView({ threshold: props.threshold ?? 0.6 });
  const [isView, setIsView] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    if (!isView && inView) {
      mounted && setIsView(true);
    }
    return () => {
      mounted = false;
    };
  }, [inView]);

  return (
    <div ref={ref} style={props.style}>
      <Slide in={isView} direction={props.direction ?? 'up'} timeout={props.timeout ?? 1000} style={{ height: '100%' }}>
        <div style={{ height: '100%' }}>
          <Fade in={isView} timeout={props.timeout ?? 1000} style={{ height: '100%' }}>
            <div>{props.children}</div>
          </Fade>
        </div>
      </Slide>
    </div>
  );
}
