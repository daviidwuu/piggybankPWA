
"use client";

import { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";
import { addDocumentNonBlocking, useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { type Transaction } from "@/lib/data";

const formSchema = z.object({
  Date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date and time",
  }),
  Amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  Type: z.enum(["Expense", "Income"]),
  Category: z.string().min(1, { message: "Category is required" }),
  Notes: z.string().min(1, { message: "Notes are required" }),
});

interface AddTransactionFormProps {
  setOpen: (open: boolean) => void;
  userId?: string;
  transactionToEdit?: Transaction | null;
  categories: string[];
}

// Helper function to format a Date object into a 'yyyy-MM-ddTHH:mm' string for datetime-local input
const formatForDateTimeLocal = (date: Date): string => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function AddTransactionForm({ setOpen, userId, transactionToEdit, categories }: AddTransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Date: formatForDateTimeLocal(new Date()),
      Amount: '' as any,
      Type: "Expense",
      Category: "",
      Notes: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (transactionToEdit) {
      const transactionDate = transactionToEdit.Date 
        ? new Date(transactionToEdit.Date.seconds * 1000)
        : new Date();
      form.reset({
        ...transactionToEdit,
        Date: formatForDateTimeLocal(transactionDate),
      });
    } else {
      form.reset({
        Date: formatForDateTimeLocal(new Date()),
        Amount: '' as any,
        Type: "Expense",
        Category: "",
        Notes: "",
      });
    }
  }, [transactionToEdit, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userId || !firestore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "User not authenticated.",
        });
        return;
    }
    setIsLoading(true);

    const transactionData = {
        ...values,
        Date: new Date(values.Date),
        userId,
    };
    
    if (transactionToEdit) {
        const transactionRef = doc(firestore, `users/${userId}/transactions`, transactionToEdit.id);
        updateDocumentNonBlocking(transactionRef, transactionData);
        toast({
            title: "Success",
            description: "Transaction updated.",
        });
    } else {
        const transactionsCollection = collection(firestore, `users/${userId}/transactions`);
        addDocumentNonBlocking(transactionsCollection, transactionData);
        toast({
            title: "Success",
            description: "New transaction added.",
        });
    }


    setIsLoading(false);
    setOpen(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="Amount"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} placeholder="$0.00" autoFocus/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="Notes"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Coffee" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

           <FormField
            control={form.control}
            name="Category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select one" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="Type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Expense">Expense</SelectItem>
                    <SelectItem value="Income">Income</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="Date"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading || !form.formState.isValid}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {transactionToEdit ? 'Update Transaction' : 'Add Transaction'}
        </Button>
      </form>
    </Form>
  );
}
