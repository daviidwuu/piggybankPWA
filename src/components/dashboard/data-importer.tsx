
"use client";

import { useEffect, useState } from "react";
import { getSheetData } from "@/ai/flows/get-sheet-data-flow";
import { type Transaction } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

// IMPORTANT: Replace this with your actual Google Apps Script URL.
const DEFAULT_SHEET_URL = "https://script.google.com/macros/s/YOUR_APPS_SCRIPT_ID/exec"; 

interface DataImporterProps {
  onImport: (transactions: Transaction[]) => void;
}

export function DataImporter({ onImport }: DataImporterProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      if (!DEFAULT_SHEET_URL.includes('YOUR_APPS_SCRIPT_ID')) {
        try {
          const transactions = await getSheetData({ googleSheetUrl: DEFAULT_SHEET_URL });
          onImport(transactions);
          toast({
            title: "Success!",
            description: "Your financial data has been loaded.",
          });
        } catch (err) {
          console.error("Failed to fetch sheet data:", err);
          toast({
            variant: "destructive",
            title: "Load Failed",
            description: "Could not automatically load data from the Google Sheet.",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        console.warn("Please replace 'YOUR_APPS_SCRIPT_ID' in src/components/dashboard/data-importer.tsx with your actual Google Apps Script URL.");
        toast({
            variant: "destructive",
            title: "Configuration Needed",
            description: "Please provide your Google Sheet URL in the code to automatically fetch data.",
        });
        setIsLoading(false);
      }
    }
    fetchData();
  }, [onImport, toast]);

  // This component no longer needs to render a UI. It just silently loads data.
  // The loading state is handled on the main page.
  return null;
}
