
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BellRing } from "lucide-react";

interface NotificationPermissionDialogProps {
  open: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export function NotificationPermissionDialog({
  open,
  onAllow,
  onDeny,
}: NotificationPermissionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onDeny()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BellRing className="h-8 w-8 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-center">Enable Browser Notifications</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Allow this app to send you push notifications directly in your web browser. For notifications from external services like Apple Shortcuts, please add your Pushover Key in the User Settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel onClick={onDeny}>Maybe Later</AlertDialogCancel>
          <AlertDialogAction onClick={onAllow}>Allow Notifications</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
