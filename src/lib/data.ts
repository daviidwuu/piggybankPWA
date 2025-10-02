export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: 'Food' | 'Transport' | 'Shopping' | 'Utilities' | 'Entertainment' | 'Other';
  amount: number;
};

export const mockTransactions: Transaction[] = [
  { id: '1', date: '2024-07-15', description: 'Grocery shopping', category: 'Food', amount: 75.50 },
  { id: '2', date: '2024-07-15', description: 'Monthly bus pass', category: 'Transport', amount: 55.00 },
  { id: '3', date: '2024-07-14', description: 'New headphones', category: 'Shopping', amount: 199.99 },
  { id: '4', date: '2024-07-13', description: 'Electricity bill', category: 'Utilities', amount: 90.25 },
  { id: '5', date: '2024-07-12', description: 'Cinema tickets', category: 'Entertainment', amount: 30.00 },
  { id: '6', date: '2024-07-12', description: 'Dinner with friends', category: 'Food', amount: 120.00 },
  { id: '7', date: '2024-07-11', description: 'Ride share to work', category: 'Transport', amount: 15.75 },
  { id: '8', date: '2024-07-10', description: 'Online course subscription', category: 'Other', amount: 49.99 },
  { id: '9', date: '2024-07-09', description: 'New T-shirt', category: 'Shopping', amount: 25.00 },
  { id: '10', date: '2024-07-08', description: 'Lunch at cafe', category: 'Food', amount: 18.50 },
  { id: '11', date: '2024-07-05', description: 'Internet bill', category: 'Utilities', amount: 65.00 },
  { id: '12', date: '2024-07-03', description: 'Concert ticket', category: 'Entertainment', amount: 85.00 },
];
