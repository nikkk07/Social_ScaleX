// Confirm dialog shown when useUnsavedGuard blocks a navigation away from a
// dirty form.
import React from 'react';
import type { Blocker } from '@/lib/router';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function UnsavedChangesDialog({ blocker }: { blocker: Blocker }) {
  const open = blocker.state === 'blocked';
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="crm-root dark">
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes on this form. Leaving now will lose them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blocker.reset?.()}>
            Keep editing
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => blocker.proceed?.()}>
            Discard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
