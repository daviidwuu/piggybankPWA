"use client";

import { useEffect, useState } from "react";
import {
  getSpendingInsights,
  type SpendingInsightsOutput,
} from "@/ai/flows/spending-insights-from-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Lightbulb, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
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
    setIsLoading(true);
    setAnalysis(null);

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
    if (!hasAnalyzed) {
      handleAnalysis();
    }
  }, [hasAnalyzed]);


  return (
    <div className="h-full flex flex-col">
        {!analysis && isLoading ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : analysis ? (
          <div className="space-y-4 text-sm animate-in fade-in-0">
             <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">{analysis.summary}</p>
              <Button
                onClick={handleAnalysis}
                disabled={isLoading}
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
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
