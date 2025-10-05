
"use client";

import { useState, useMemo } from "react";
import { type Budget, type User } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Trash2, Plus, DollarSign } from "lucide-react";

interface BudgetPageProps {
  user: User;
  budgets: Budget[];
  onUpdateIncome: (newIncome: number) => void;
  onUpdateSavings: (newSavings: number) => void;
  onUpdateBudget: (category: string, newBudget: number) => void;
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

export function BudgetPage({ 
  user,
  budgets, 
  onUpdateIncome, 
  onUpdateSavings, 
  onUpdateBudget, 
  onAddCategory, 
  onDeleteCategory 
}: BudgetPageProps) {
  const [newCategory, setNewCategory] = useState("");
  const [isCategoryManagerOpen, setCategoryManagerOpen] = useState(false);
  
  const [currentIncome, setCurrentIncome] = useState(user?.income ?? 0);
  const [currentSavings, setCurrentSavings] = useState(user?.savings ?? 0);

  const [budgetValues, setBudgetValues] = useState<Record<string, string>>(() => {
    const initialState: Record<string, string> = {};
    (user?.categories || []).forEach(category => {
        const budget = budgets.find(b => b.Category === category);
        initialState[category] = budget ? String(budget.MonthlyBudget) : '0';
    });
    return initialState;
  });

  const categories = user?.categories || [];
  const income = user?.income ?? 0;
  const savings = user?.savings ?? 0;

  const totalBudgeted = useMemo(() => budgets.reduce((sum, b) => sum + b.MonthlyBudget, 0), [budgets]);
  const leftToBudget = useMemo(() => income - savings - totalBudgeted, [income, savings, totalBudgeted]);

  const handleAddCategory = () => {
    if (newCategory.trim() !== "" && !categories.includes(newCategory.trim())) {
      onAddCategory(newCategory.trim());
      setNewCategory("");
    }
  };

  const handleBudgetChange = (category: string, value: string) => {
    setBudgetValues(prev => ({ ...prev, [category]: value }));
  };

  const handleBudgetBlur = (category: string) => {
    const value = parseFloat(budgetValues[category] || '0');
    if (!isNaN(value)) {
      onUpdateBudget(category, value);
    }
  };


  return (
    <ScrollArea className="w-full max-h-[70vh]">
        <div className="space-y-6 px-4">
            <Card className="border-none shadow-none">
                <CardHeader>
                    <CardTitle>Income & Savings</CardTitle>
                    <CardDescription>Set your monthly income and savings goal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Monthly Income</label>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <Input
                                type="number"
                                defaultValue={currentIncome}
                                onBlur={(e) => onUpdateIncome(parseFloat(e.target.value) || 0)}
                                onChange={(e) => setCurrentIncome(parseFloat(e.target.value) || 0)}
                                className="h-9"
                                placeholder="e.g., 3000"
                                inputMode="decimal"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Monthly Savings Goal</label>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <Input
                                type="number"
                                defaultValue={currentSavings}
                                onBlur={(e) => onUpdateSavings(parseFloat(e.target.value) || 0)}
                                onChange={(e) => setCurrentSavings(parseFloat(e.target.value) || 0)}
                                className="h-9"
                                placeholder="e.g., 500"
                                inputMode="decimal"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-none">
                <CardHeader className="flex-row items-center justify-between">
                    <div className="space-y-1.5">
                        <CardTitle>Category Budgets</CardTitle>
                        <CardDescription>Allocate your spending limits.</CardDescription>
                    </div>
                    <Drawer open={isCategoryManagerOpen} onOpenChange={setCategoryManagerOpen}>
                        <DrawerTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary flex-shrink-0">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent onOpenAutoFocus={(e) => e.preventDefault()}>
                            <DrawerHeader>
                                <DrawerTitle>Manage Categories</DrawerTitle>
                                <DrawerDescription>Add new spending categories or remove ones you no longer need.</DrawerDescription>
                            </DrawerHeader>
                            <div className="space-y-4 pt-4 px-4">
                                <div className="flex items-center gap-2">
                                    <Input 
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        placeholder="New Category Name"
                                        className="h-9"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                    />
                                    <Button size="sm" onClick={handleAddCategory}>
                                        <Plus className="h-4 w-4 mr-1"/>
                                        Add
                                    </Button>
                                </div>
                                <ScrollArea className="h-64">
                                    <div className="space-y-2 pr-4">
                                        {categories.map((category) => (
                                            <div key={category} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                                <span className="font-medium">{category}</span>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDeleteCategory(category)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </DrawerContent>
                    </Drawer>
                </CardHeader>
                <CardContent className="space-y-4 pb-4">
                    <div className="w-full flex justify-between items-center py-4 border-b">
                        <span className="font-medium text-muted-foreground">Left to Budget:</span>
                        <span className={`font-bold text-lg ${leftToBudget < 0 ? 'text-destructive' : 'text-primary'}`}>
                            ${leftToBudget.toFixed(2)}
                        </span>
                    </div>
                    <div className="space-y-3 pt-2">
                        {categories.map((category) => (
                            <div key={category} className="flex items-center justify-between gap-4">
                                <span className="font-medium truncate pr-2">{category}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Input
                                        type="number"
                                        value={budgetValues[category] ?? ''}
                                        onChange={(e) => handleBudgetChange(category, e.target.value)}
                                        onBlur={() => handleBudgetBlur(category)}
                                        className="h-8 w-24 text-right"
                                        placeholder="0.00"
                                        inputMode="decimal"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    </ScrollArea>
  );
}

    