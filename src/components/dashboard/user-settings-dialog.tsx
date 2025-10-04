
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type User } from "@/lib/data";
import { Loader2, Copy } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, { message: "Please enter your name." }),
});

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  userId?: string;
  onSave: (name: string) => void;
  onCopyUserId: () => void;
}

export function UserSettingsDialog({ open, onOpenChange, user, userId, onSave, onCopyUserId }: UserSettingsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({ name: user.name });
    }
  }, [user, form, open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    onSave(values.name);
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            Update your name and view your unique User ID for connecting with external services like Apple Shortcuts.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4 space-y-6">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                          <Input
                          placeholder="e.g., David"
                          {...field}
                          />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
                </Button>
            </form>
            </Form>
          
            {userId && (
            <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Your unique User ID:</p>
                <div className="flex items-center w-full gap-2">
                    <Input readOnly value={userId} className="text-xs" />
                    <Button variant="outline" size="icon" onClick={onCopyUserId}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
