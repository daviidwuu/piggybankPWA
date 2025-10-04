
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserData } from "@/lib/data";

const settingsSchema = z.object({
  income: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("Income must be a positive number.")
  ),
  savings: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("Savings goal must be a positive number.")
  ),
  pushoverKey: z.string().optional(),
});

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData;
  onUpdateIncome: (income: number) => void;
  onUpdateSavings: (savings: number) => void;
  onUpdatePushoverKey: (key: string | undefined) => void;
}

export function UserSettingsDialog({
  open,
  onOpenChange,
  user,
  onUpdateIncome,
  onUpdateSavings,
  onUpdatePushoverKey,
}: UserSettingsDialogProps) {
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      income: user.income || 0,
      savings: user.savings || 0,
      pushoverKey: user.pushoverKey || "",
    },
  });

  function onSubmit(values: z.infer<typeof settingsSchema>) {
    onUpdateIncome(values.income);
    onUpdateSavings(values.savings);
    if (values.pushoverKey !== user.pushoverKey) {
        onUpdatePushoverKey(values.pushoverKey);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
          <DialogDescription>
            Manage your monthly income and savings goal.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="income"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Income</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="savings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Savings Goal</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pushoverKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pushover User Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your Pushover user key" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    For receiving notifications from Apple Shortcuts. Get this
                    from the{" "}
                    <a
                      href="https://pushover.net/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Pushover app
                    </a>
                    .
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
