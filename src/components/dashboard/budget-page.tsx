
"use client";

import { useState } from "react";
import { type Budget } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pencil, Trash2, Plus } from "lucide-react";

interface BudgetPageProps {
  budgets: Budget[];
  categories: string[];
  onUpdateBudget: (category: string, newBudget: number) => void;
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

export function BudgetPage({ budgets, categories, onUpdateBudget, onAddCategory, onDeleteCategory }: BudgetPageProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newBudgetValue, setNewBudgetValue] = useState<number | string>("");
  const [newCategory, setNewCategory] = useState("");

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
    <Card className="w-full border-none shadow-none">
      <CardHeader>
        <CardDescription>
          Set and manage your monthly spending limits for each category.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => {
          const budget = getBudgetForCategory(category);
          const isEditing = editingCategory === category;
          return (
            <div key={category} className="flex items-center justify-between">
              <span className="font-medium">{category}</span>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={newBudgetValue}
                    onChange={(e) => setNewBudgetValue(e.target.value)}
                    className="h-8 w-24"
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleSaveClick(category)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelClick}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">${budget.MonthlyBudget.toFixed(2)}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(budget)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDeleteCategory(category)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        <div className="flex items-center gap-2 pt-4">
          <Input 
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New Category Name"
            className="h-8"
          />
          <Button size="sm" onClick={handleAddCategory}>
            <Plus className="h-4 w-4 mr-1"/>
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
