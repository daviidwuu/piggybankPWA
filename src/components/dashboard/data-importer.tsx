
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

const FormSchema = z.object({
  googleSheetUrl: z
    .string()
    .url({ message: "Please enter a valid Google Sheet URL." }),
});

interface DataImporterProps {
  onImport: () => void;
  isDataLoaded: boolean;
}

export function DataImporter({ onImport, isDataLoaded }: DataImporterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      googleSheetUrl: "https://docs.google.com/spreadsheets/d/example",
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    onImport(); // Trigger the parent component's import logic

    // Simulate import delay
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Success!",
        description: "Your financial data has been imported.",
      });
    }, 1000);
  }

  if (isDataLoaded) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Your Data</CardTitle>
        <CardDescription>
          Paste the URL of your Google Sheet to get started. Ensure it's
          publicly accessible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col md:flex-row items-start gap-4"
          >
            <FormField
              control={form.control}
              name="googleSheetUrl"
              render={({ field }) => (
                <FormItem className="flex-grow w-full">
                  <FormControl>
                    <Input
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Importing..." : "Import Data"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
