export type TransactionType = 'income' | 'expense';

export interface Profile {
  id: string;
  name: string;
  email: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string; // Relacionamento com o usuário
  value: number;
  description: string;
  category: string;
  date: string;
  type: TransactionType;
}

export interface MonthlyGoal {
  id: string;
  user_id: string;
  month: string; // Formato YYYY-MM
  amount: number;
}

export interface CategorySummary {
  category: string;
  total: number;
  type: TransactionType;
}
