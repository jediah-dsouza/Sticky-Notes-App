import { useLayoutEffect, useRef } from 'react';
import type { Note } from '../../features/notes/noteTypes';

/** Presentation only: CSS Grid places one ordered list; never reorder notes. */
export function useMasonryLayout(notes: readonly Note[]) {
  const ref = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    const list = ref.current;
    // Without observation, retain the readable responsive Grid fallback.
    if (!list || typeof ResizeObserver === 'undefined') return;
    const items = Array.from(list.children) as HTMLLIElement[];
    let frame: number | undefined;

    function measure() {
      const styles = getComputedStyle(list!);
      const row = Number.parseFloat(styles.getPropertyValue('--masonry-row'));
      const gutter = Number.parseFloat(
        styles.getPropertyValue('--masonry-gutter'),
      );
      if (!(row > 0) || !(gutter >= 0)) return;
      // Read every natural article height before writing allocated li spans.
      const spans = items.map((item) => {
        const height = item.firstElementChild?.getBoundingClientRect().height;
        return height ? Math.ceil((height + gutter) / row) : 0;
      });
      if (spans.some((span) => span === 0)) return;
      items.forEach((item, index) => {
        const end = `span ${spans[index]}`;
        if (item.style.gridRowEnd !== end) item.style.gridRowEnd = end;
      });
      list!.dataset.masonry = 'ready';
    }

    const observer = new ResizeObserver(() => {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        measure();
      });
    });
    observer.observe(list);
    items.forEach((item) => {
      if (item.firstElementChild) observer.observe(item.firstElementChild);
    });
    measure(); // Before paint, including a changed collection after edit/delete.
    return () => {
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
      delete list.dataset.masonry;
      items.forEach((item) => item.style.removeProperty('grid-row-end'));
    };
  }, [notes]);

  return ref;
}
