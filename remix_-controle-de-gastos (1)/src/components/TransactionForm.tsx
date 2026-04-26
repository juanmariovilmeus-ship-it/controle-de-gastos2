import React, { useState } from 'react';
import { X } from 'lucide-react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/src/constants';
import { TransactionType, Transaction } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface TransactionFormProps {
  type: TransactionType;
  onClose: () => void;
  onSubmit: (transaction: Omit<Transaction, 'id' | 'user_id'>) => void;
}

export default function TransactionForm({ type, onClose, onSubmit }: TransactionFormProps) {
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || !description || !category || !date) return;

    const transaction: Omit<Transaction, 'id' | 'user_id'> = {
      value: parseFloat(value),
      description,
      category,
      date,
      type
    };

    onSubmit(transaction);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom duration-300"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold">
            {type === 'income' ? 'Novo Ganho' : 'Novo Gasto'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase">Valor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
              <input 
                autoFocus
                type="number" 
                step="0.01"
                placeholder="0,00"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold text-lg"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase">Descrição</label>
            <input 
              type="text" 
              placeholder="Ex: Almoço, Salário..."
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase">Categoria</label>
            <select 
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Selecionar categoria</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase">Data</label>
            <input 
              type="date" 
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit"
            className={cn(
              "w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 mt-4",
              type === 'income' ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 shadow-lg" : "bg-rose-500 hover:bg-rose-600 shadow-rose-200 shadow-lg"
            )}
          >
            Salvar Lançamento
          </button>
        </form>
      </div>
    </div>
  );
}
