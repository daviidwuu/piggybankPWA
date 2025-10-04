
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

const formSchema = z.object({
  Date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  Amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  Type: z.enum(["Expense", "Income"]),
  Category: z.string().min(1, { message: "Category is required" }),
  Notes: z.string().min(1, { message: "Notes are required" }),
});

const categories = [
  "Food & Drinks",
  "Gambling",
  "Drinks",
  "Girlfriend",
  "Entertainment",
  "Shopping",
  "Transport",
  "Dad",
  "Others",
];

const totalSteps = 5;

interface AddTransactionFormProps {
  onSuccess: () => void;
  setOpen: (open: boolean) => void;
  googleSheetUrl: string;
}

export function AddTransactionForm({ onSuccess, setOpen, googleSheetUrl }: AddTransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Date: new Date().toISOString().split("T")[0],
      Amount: '' as any,
      Type: "Expense",
      Category: "",
      Notes: "",
    },
    mode: "onChange",
  });

  const { trigger, formState } = form;

  const handleNext = async () => {
    const fields: (keyof z.infer<typeof formSchema>)[] = ["Amount", "Notes", "Category", "Type", "Date"];
    const currentStepField = fields[step];
    
    const isValid = await trigger(currentStepField);

    if (isValid) {
      if (step < fields.length - 1) {
         setStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/add-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleSheetUrl,
          sheetName: "Transactions",
          data: { ...values, ID: "" },
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to add transaction";
        try {
          const errorData = await response.json();
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast({
        title: "Success",
        description: "New transaction added.",
      });
      onSuccess();
      setOpen(false);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "There was a problem with your request.";
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const isNextDisabled = () => {
    const field = ["Amount", "Notes", "Category", "Type", "Date"][step] as keyof z.infer<typeof formSchema>;
    return !!formState.errors[field] || !form.getValues(field);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {step > 0 && (
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack} type="button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div>
          {step === 0 && (
            <FormField
              control={form.control}
              name="Amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Amount</FormLabel>
                  <FormControl>
                    <Input className="h-14 text-2xl" type="number" step="0.01" {...field} placeholder="$0.00" autoFocus/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {step === 1 && (
            <FormField
              control={form.control}
              name="Notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">What was this for?</FormLabel>
                  <FormControl>
                    <Input className="h-14 text-2xl" {...field} placeholder="e.g., Coffee" autoFocus/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {step === 2 && (
             <FormField
              control={form.control}
              name="Category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Category</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-14 text-2xl">
                        <SelectValue placeholder="Select one" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-lg">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {step === 3 && (
            <FormField
              control={form.control}
              name="Type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Type</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-14 text-2xl">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Expense" className="text-lg">Expense</SelectItem>
                      <SelectItem value="Income" className="text-lg">Income</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {step === 4 && (
            <FormField
              control={form.control}
              name="Date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Date</FormLabel>
                  <FormControl>
                    <Input className="h-14 text-2xl" type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        
        {step < totalSteps - 1 ? (
            <Button type="button" onClick={handleNext} className="w-full h-12 text-lg" disabled={isNextDisabled()}>
              Next
            </Button>
        ) : (
          <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading || !formState.isValid}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Transaction
          </Button>
        )}
      </form>
    </Form>
  );
}
