
"use client";

import { useState, useMemo } from "react";
import { type Budget, type User } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newBudgetValue, setNewBudgetValue] = useState<number | string>("");
  const [newCategory, setNewCategory] = useState("");
  
  const [currentIncome, setCurrentIncome] = useState(user?.income ?? 0);
  const [currentSavings, setCurrentSavings] = useState(user?.savings ?? 0);

  const categories = user?.categories || [];
  const income = user?.income ?? 0;
  const savings = user?.savings ?? 0;

  const totalBudgeted = useMemo(() => budgets.reduce((sum, b) => sum + b.MonthlyBudget, 0), [budgets]);
  const leftToBudget = useMemo(() => income - savings - totalBudgeted, [income, savings, totalBudgeted]);

  const handleEditClick = (budget: Budget) => {
    setEditingCategory(budget.Category);
    setNewBudgetValue(budget.MonthlyBudget);
  };

  const handleSaveClick = (category: string) => {
    const budgetValue = typeof newBudgetValue === "string" ? parseFloat(newBudgetValue) : newBudgetValue;
    if (!isNaN(budgetValue) && budgetValue >= 0) {
      onUpdateBudget(category, budgetValue);
      setEditingCategory(null);
      setNewBudgetValue("");
    }
  };
  
  const handleCancelClick = () => {
    setEditingCategory(null);
    setNewBudgetValue("");
  };

  const handleAddCategory = () => {
    if (newCategory.trim() !== "" && !categories.includes(newCategory.trim())) {
      onAddCategory(newCategory.trim());
      setNewCategory("");
    }
  };

  const getBudgetForCategory = (category: string): Budget => {
    return budgets.find(b => b.Category === category) || { id: category, Category: category, MonthlyBudget: 0 };
  };

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="budgets">Budgets</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="mt-4">
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Your monthly income, savings, and budget summary.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full flex justify-between items-center p-3 rounded-lg bg-muted">
                <span className="font-medium text-muted-foreground">Left to Budget:</span>
                <span className={`font-bold text-lg ${leftToBudget < 0 ? 'text-destructive' : 'text-primary'}`}>
                    ${leftToBudget.toFixed(2)}
                </span>
            </div>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="budgets" className="mt-4">
        <Card className="border-none shadow-none">
          <CardHeader>
             <CardTitle>Category Budgets</CardTitle>
            <CardDescription>Allocate your spending limits for each category.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {categories.map((category) => {
              const budget = getBudgetForCategory(category);
              const isEditing = editingCategory === category;
              return (
                <div key={category} className="flex items-center justify-between">
                  <span className="font-medium truncate pr-2">{category}</span>
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Input
                        type="number"
                        value={newBudgetValue}
                        onChange={(e) => setNewBudgetValue(e.target.value)}
                        className="h-8 w-24"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveClick(category)}
                      />
                      <Button size="sm" onClick={() => handleSaveClick(category)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelClick}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-muted-foreground w-20 text-right">${budget.MonthlyBudget.toFixed(2)}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(budget)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="categories" className="mt-4">
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle>Manage Categories</CardTitle>
            <CardDescription>Add or remove spending categories.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {categories.map((category) => (
                    <div key={category} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                        <span className="font-medium">{category}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDeleteCategory(category)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
