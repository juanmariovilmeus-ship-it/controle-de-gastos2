import { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Summary from './components/Summary';
import { Transaction, TransactionType, MonthlyGoal } from './types';
import { formatCurrency, cn } from './lib/utils';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Loader2, Target, AlertCircle } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import AuthScreen from './components/Auth/AuthScreen';
import { supabase } from './lib/supabase';
import { format, isSameMonth, parseISO } from 'date-fns';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'list' | 'summary'>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [dataLoading, setDataLoading] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<MonthlyGoal | null>(null);

  // Fetch transactions from Supabase
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    
    setDataLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Failed to load transactions", error);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  // Fetch current month goal
  const fetchCurrentGoal = useCallback(async () => {
    if (!user) return;
    const monthKey = format(new Date(), 'yyyy-MM');
    const { data, error } = await supabase
      .from('monthly_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', monthKey)
      .maybeSingle();
    
    if (!error) setCurrentGoal(data);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchCurrentGoal();
    } else {
      setTransactions([]);
      setCurrentGoal(null);
    }
  }, [user, fetchTransactions, fetchCurrentGoal]);

  const handleAddTransaction = async (t: Omit<Transaction, 'id' | 'user_id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...t, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setTransactions([data, ...transactions]);
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Erro ao salvar transação. Tente novamente.");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Erro ao excluir transação.");
    }
  };

  const openAddForm = (type: TransactionType) => {
    setFormType(type);
    setIsFormOpen(true);
  };

  const monthTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => isSameMonth(parseISO(t.date), now));
  }, [transactions]);

  // Auth Guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.value, 0);
  const monthExpense = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.value, 0);
  const balance = monthIncome - monthExpense;

  const goalProgress = currentGoal ? (monthExpense / currentGoal.amount) * 100 : 0;

  const recentTransactions = transactions.slice(0, 5);

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onAddIncome={() => openAddForm('income')}
      onAddExpense={() => openAddForm('expense')}
    >
      {activeTab === 'home' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
          {/* Hero Monthly Card */}
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1">Saldo do Mês</p>
                  <h2 className="text-4xl font-black">{formatCurrency(balance)}</h2>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                  <TrendingUp size={24} className="text-white" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <p className="text-[10px] text-indigo-100 font-bold uppercase">Entradas</p>
                  </div>
                  <p className="text-lg font-black text-white">{formatCurrency(monthIncome)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <p className="text-[10px] text-indigo-100 font-bold uppercase">Saídas</p>
                  </div>
                  <p className="text-lg font-black text-white">{formatCurrency(monthExpense)}</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 px-1">
            <button 
              onClick={() => openAddForm('income')}
              className="flex-1 bg-white border border-gray-100 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
            >
              <ArrowUpRight size={18} />
              Receita
            </button>
            <button 
              onClick={() => openAddForm('expense')}
              className="flex-1 bg-white border border-gray-100 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 text-rose-600 hover:bg-rose-50 transition-colors shadow-sm"
            >
              <ArrowDownRight size={18} />
              Gasto
            </button>
          </div>

          {/* Month Goal Preview */}
          {currentGoal && (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-indigo-600" />
                  <span className="text-sm font-bold text-gray-800">Meta do Mês</span>
                </div>
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  goalProgress > 100 ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"
                )}>
                  {Math.round(goalProgress)}%
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000 ease-out",
                      goalProgress > 100 ? "bg-rose-500" : goalProgress > 85 ? "bg-amber-500" : "bg-indigo-500"
                    )}
                    style={{ width: `${Math.min(goalProgress, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-medium">
                  {formatCurrency(monthExpense)} de {formatCurrency(currentGoal.amount)}
                </p>
              </div>
            </div>
          )}

          {/* Recent Feed */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-bold text-gray-800">Atividade Recente</h3>
              <button 
                onClick={() => setActiveTab('list')} 
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Ver tudo
              </button>
            </div>
            {dataLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-gray-300" size={24} />
              </div>
            ) : (
              <TransactionList 
                transactions={recentTransactions} 
                onDelete={handleDeleteTransaction}
                compact
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="animate-in fade-in duration-300">
          <h2 className="text-2xl font-black text-gray-900 mb-6 px-1">Histórico</h2>
          <TransactionList transactions={transactions} onDelete={handleDeleteTransaction} />
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="animate-in fade-in duration-300">
          <h2 className="text-2xl font-black text-gray-900 mb-6 px-1">Seu Resumo</h2>
          <Summary transactions={transactions} />
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <TransactionForm 
          type={formType} 
          onClose={() => setIsFormOpen(false)} 
          onSubmit={handleAddTransaction} 
        />
      )}
    </Layout>
  );
}
