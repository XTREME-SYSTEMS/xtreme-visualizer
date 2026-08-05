import { useRef, useState, type ReactNode } from 'react';
import { ArrowDown, LoaderCircle } from 'lucide-react';

export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<void>; children: ReactNode }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 70;
  const MAX = 100;

  const getScrollParent = (): HTMLElement | null => {
    let el = wrapperRef.current?.parentElement;
    while (el) {
      const style = window.getComputedStyle(el);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') return el;
      el = el.parentElement;
    }
    return null;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (refreshing) return;
    const scroll = getScrollParent();
    if (scroll && scroll.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
      setIsPulling(true);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    const scroll = getScrollParent();
    if (delta > 0 && scroll && scroll.scrollTop <= 0) {
      setPull(Math.min(delta * 0.4, MAX));
    }
  };

  const onTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    setIsPulling(false);
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try { await onRefresh(); } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  return (
    <div ref={wrapperRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
      <div style={{ height: pull, overflow: 'hidden', display: 'grid', placeItems: 'center', transition: isPulling ? 'none' : 'height .2s ease' }}>
        {refreshing ? <LoaderCircle className="vx-icon" style={{ animation: 'spin .8s linear infinite' }} /> : <ArrowDown className="vx-icon" style={{ opacity: Math.min(pull / THRESHOLD, 1), transform: pull >= THRESHOLD ? 'rotate(180deg)' : 'none', transition: 'opacity .1s, transform .1s' }} />}
      </div>
      {children}
    </div>
  );
}