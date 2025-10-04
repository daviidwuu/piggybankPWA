export interface Transaction {
  id: string;
  Date: { seconds: number; nanoseconds: number; } | null;
  Amount: number;
  Type: string;
  Category: string;
  Notes: string;
}

export interface Budget {
  id: string;
  Category: string;
  MonthlyBudget: number;
}
