// Guards a dirty form against accidental loss: in-app navigation (React Router
// useBlocker), tab close / hard refresh (beforeunload). A form that saved
// successfully is no longer dirty — markSaved() lets the post-save redirect
// through without a prompt.
import { useCallback, useEffect, useRef } from 'react';
import { useBlocker, type Blocker } from '@/lib/router';

export function useUnsavedGuard(isDirty: boolean): {
  blocker: Blocker;
  markSaved: () => void;
} {
  const savedRef = useRef(false);
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  // Refs (not the render-time value) so the predicate always sees current state.
  const blocker = useBlocker(() => dirtyRef.current && !savedRef.current);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (savedRef.current) return;
      e.preventDefault();
      e.returnValue = ''; // required for the native prompt in some browsers
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const markSaved = useCallback(() => {
    savedRef.current = true;
  }, []);

  return { blocker, markSaved };
}
