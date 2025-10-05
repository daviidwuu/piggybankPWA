
"use client";

import { useEffect, useState, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { addDocumentNonBlocking, useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { type Transaction } from "@/lib/data";
import { DrawerHeader, DrawerTitle } from "../ui/drawer";

const formSchema = z.object({
  Amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  Category: z.string().min(1, { message: "Category is required" }),
  Notes: z.string().min(1, { message: "Notes are required" }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddTransactionFormProps {
  setOpen: (open: boolean) => void;
  userId?: string;
  transactionToEdit?: Transaction | null;
  categories: string[];
}

export function AddTransactionForm({ setOpen, userId, transactionToEdit, categories }: AddTransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const { toast } = useToast();
  const firestore = useFirestore();
  const amountInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Amount: '' as any,
      Category: "",
      Notes: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (transactionToEdit) {
      form.reset({
        ...transactionToEdit,
        Amount: transactionToEdit.Amount,
      });
    } else {
      form.reset({
        Amount: '' as any,
        Category: "",
        Notes: "",
      });
    }
    // Reset step to 0 whenever the form is opened/re-opened
    setStep(0);
  }, [transactionToEdit, form, setOpen]);

  const nextStep = async (field?: keyof FormValues) => {
    if (field) {
        const isValid = await form.trigger(field);
        if (!isValid) return;
    }
    setStep((s) => s + 1);
  };

  const prevStep = () => {
    setStep((s) => s - 1);
  };

  async function onSubmit(values: FormValues) {
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
        Date: new Date(),
        Type: 'Expense',
        userId,
    };
    
    try {
        if (transactionToEdit) {
            const transactionRef = doc(firestore, `users/${userId}/transactions`, transactionToEdit.id);
            updateDocumentNonBlocking(transactionRef, transactionData);
        } else {
            const transactionsCollection = collection(firestore, `users/${userId}/transactions`);
            await addDocumentNonBlocking(transactionsCollection, transactionData);
        }
    } catch(e) {
        toast({
            variant: "destructive",
            title: "Error adding transaction",
            description: "There was an error adding the transaction.",
        });
    }


    setIsLoading(false);
    setOpen(false);
  }

  const handleCategorySelect = (category: string) => {
    form.setValue("Category", category, { shouldValidate: true });
    nextStep();
  };

  return (
    <>
      <DrawerHeader className="text-left relative">
        {step > 0 && (
          <Button variant="ghost" onClick={prevStep} className="absolute left-4 top-1/2 -translate-y-1/2 px-2 h-auto focus:bg-transparent focus:text-current">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <DrawerTitle className="text-center">{transactionToEdit ? 'Edit Transaction' : 'Add New Transaction'}</DrawerTitle>
      </DrawerHeader>
      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form. handleSubmit(onSubmit)} className="space-y-4">
              <div className={`transition-opacity duration-300 ${step === 0 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                <FormField
                    control={form.control}
                    name="Amount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                        <Input 
                          ref={amountInputRef}
                          type="number" 
                          step="0.01" 
                          {...field} 
                          placeholder="$0.00" 
                          inputMode="decimal"
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

              <div className={`transition-opacity duration-300 ${step === 1 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                  <fieldset className="space-y-2">
                      <legend className="text-sm font-medium">Category</legend>
                      <div className="flex flex-wrap gap-2">
                          {categories.map((cat) => (
                              <Button
                                  type="button"
                                  key={cat}
                                  variant={form.watch("Category") === cat ? "default" : "outline"}
                                  onClick={() => handleCategorySelect(cat)}
                              >
                                  {cat}
                              </Button>
                          ))}
                      </div>
                      <FormMessage>{form.formState.errors.Category?.message}</FormMessage>
                  </fieldset>
              </div>

              <div className={`transition-opacity duration-300 ${step === 2 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                <FormField
                    control={form.control}
                    name="Notes"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                        <Textarea {...field} placeholder="e.g., Coffee" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
            
            <div className="pt-4">
                {step === 0 && (
                    <Button 
                        type="button"
                        onClick={() => nextStep('Amount')} 
                        className="w-full h-12 text-lg"
                        disabled={!form.watch('Amount')}
                    >
                        Next
                    </Button>
                )}
                {step === 2 && (
                    <Button 
                        type="submit" 
                        className="w-full h-12 text-lg" 
                        disabled={isLoading || !form.formState.isValid}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {transactionToEdit ? 'Update Transaction' : 'Add Transaction'}
                    </Button>
                )}
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
