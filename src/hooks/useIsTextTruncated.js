import { useEffect, useRef, useState } from 'react';

/** 말줄임(noWrap) 요소의 글자가 실제로 잘렸는지 알려 준다. 폭이 바뀌거나 글꼴이 늦게 로드돼도 다시 잰다. */
export const useIsTextTruncated = (text) => {
  const elementRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    let isActive = true;
    const measure = () => {
      if (isActive) {
        setIsTruncated(element.scrollWidth > element.clientWidth);
      }
    };
    const observer = new ResizeObserver(measure);

    observer.observe(element);
    document.fonts?.ready.then(measure);

    return () => {
      isActive = false;
      observer.disconnect();
    };
  }, [text]);

  return { elementRef, isTruncated };
};
