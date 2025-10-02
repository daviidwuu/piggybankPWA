"use client";

import { useState } from "react";
import {
  getSpendingInsights,
  type SpendingInsightsOutput,
} from "@/ai/flows/spending-insights-from-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Lightbulb, TrendingUp, Loader2 } from "lucide-react";
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
  const { toast } = useToast();

  const handleAnalysis = async () => {
    setIsLoading(true);
    setAnalysis(null);

    // Format data for the AI prompt
    const financialDataString = transactions
      .map(
        (t) =>
          `${t.date}: ${t.Description} (${t.Category}) - $${t.amount.toFixed(
            2
          )}`
      )
      .join("\n");

    try {
      const result = await getSpendingInsights({
        financialData: financialDataString,
      });
      setAnalysis(result);
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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-primary" /> AI-Powered Spending Analysis
        </CardTitle>
        <CardDescription>
          Get personalized insights and savings recommendations from our AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : analysis ? (
          <div className="space-y-4 text-sm animate-in fade-in-0">
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-primary" /> Insights
              </h4>
              <p className="text-muted-foreground">{analysis.insights}</p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Recommendations
              </h4>
              <p className="text-muted-foreground">{analysis.recommendations}</p>
            </div>
          </div>
        ) : (
          <div className="m-auto text-center flex flex-col items-center">
            <p className="text-muted-foreground mb-4">
              Click the button to analyze your spending.
            </p>
            <Button
              onClick={handleAnalysis}
              disabled={isLoading || transactions.length === 0}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate Insights
            </Button>
          </div>
        )}

        {analysis && !isLoading && (
          <div className="mt-auto pt-4">
            <Button
              onClick={handleAnalysis}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Regenerate Insights
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
