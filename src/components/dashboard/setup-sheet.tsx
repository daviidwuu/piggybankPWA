
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import { Loader2, Copy } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, { message: "Please enter your name." }),
});

interface SetupSheetProps {
  onSave: (data: { name: string; }) => void;
  onCopyUserId: () => void;
  userId?: string;
}

export function SetupSheet({ onSave, onCopyUserId, userId }: SetupSheetProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    onSave({ name: values.name });
  }

  return (
    <Card className="w-full max-w-md">
        <CardHeader>
            <CardTitle>Welcome to piggybank</CardTitle>
            <CardDescription>
                To get started, please enter your name. Then, copy your unique User ID to use in your Apple Shortcut for adding transactions.
            </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
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
                Save and Continue
                </Button>
            </form>
            </Form>
        </CardContent>
        {userId && (
          <CardFooter className="flex-col items-start gap-2 pt-4">
              <p className="text-sm text-muted-foreground">Your unique User ID:</p>
              <div className="flex items-center w-full gap-2">
                  <Input readOnly value={userId} className="text-xs" />
                  <Button variant="outline" size="icon" onClick={onCopyUserId}>
                      <Copy className="h-4 w-4" />
                  </Button>
              </div>
          </CardFooter>
        )}
    </Card>
  );
}

    