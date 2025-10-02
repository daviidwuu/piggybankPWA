export type Transaction = {
  id: string;
  date: string;
  Description: string;
  Category:
    | 'Food'
    | 'Transport'
    | 'Shopping'
    | 'Utilities'
    | 'Entertainment'
    | 'Other';
  amount: number;
};
