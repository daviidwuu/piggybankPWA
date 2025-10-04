
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
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, { message: "Please enter your name." }),
  googleSheetUrl: z.string().url({ message: "Please enter a valid URL." }),
});

interface SetupSheetProps {
  onSave: (data: { name: string; url: string }) => void;
}

export function SetupSheet({ onSave }: SetupSheetProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      googleSheetUrl: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    onSave({ name: values.name, url: values.googleSheetUrl });
  }

  return (
    <Card className="w-full max-w-md">
        <CardHeader>
            <CardTitle>Welcome to FinTrack Mini</CardTitle>
            <CardDescription>
                To get started, please enter your name and the URL of your Google Apps Script.
            </CardDescription>
        </CardHeader>
        <CardContent className="pb-10">
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
                <FormField
                control={form.control}
                name="googleSheetUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Google Apps Script URL</FormLabel>
                    <FormControl>
                        <Input
                        placeholder="https://script.google.com/macros/s/..."
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
    </Card>
  );
}
