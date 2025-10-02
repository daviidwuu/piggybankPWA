export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: 'Food' | 'Transport' | 'Shopping' | 'Utilities' | 'Entertainment' | 'Other';
  amount: number;
};
