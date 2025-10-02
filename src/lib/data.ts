export interface Transaction {
  ID: string; // Column A
  Date: string | null; // Column B - Can be null if date is invalid
  Amount: number; // Column C
  Type: string; // Column D (Income / Expense)
  Category: string; // Column E
  Notes: string; // Column F
}

export interface Budget {
  Category: string;
  Budget: number;
}
