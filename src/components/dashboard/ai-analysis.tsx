"use client";

import { useEffect, useState } from "react";
import {
  getSpendingInsights,
  type SpendingInsightsOutput,
} from "@/ai/flows/spending-insights-from-data";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, CheckCircle2 } from "lucide-react";
import type { Transaction } from "@/lib/data";
import { Separator } from "@/components/ui/separator";

interface AiAnalysisProps {
  transactions: Transaction[];
}

export function AiAnalysis({ transactions }: AiAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SpendingInsightsOutput | null>(
    null
  );
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    if (analysis) return; // Don't re-run if we have analysis
    setIsLoading(true);

    const financialDataString = transactions
      .map(
        (t) =>
          `${t.Date}: ${t.Notes} (${t.Category}) - $${t.Amount.toFixed(
            2
          )}`
      )
      .join("\n");

    try {
      const result = await getSpendingInsights({
        financialData: financialDataString,
      });
      setAnalysis(result);
      setHasAnalyzed(true);
    } catch (error) {
      console.error("AI analysis failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not generate spending insights at this time.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Automatically trigger analysis if it hasn't been done yet.
    if (!hasAnalyzed) {
      handleAnalysis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnalyzed]);


  return (
    <div className="h-full flex flex-col">
        {!analysis && isLoading ? (
          <div className="space-y-4 pt-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : analysis ? (
          <div className="space-y-4 text-base animate-in fade-in-0">
             <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            <Separator/>
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-primary" /> Key Insights
              </h4>
              <ul className="space-y-1.5 text-muted-foreground list-disc pl-5">
                {analysis.insights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Recommendations
              </h4>
              <ul className="space-y-1.5 text-muted-foreground">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                     <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                     <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
    </div>
  );
}
