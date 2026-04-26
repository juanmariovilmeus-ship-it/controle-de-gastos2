import { useState, useEffect, useMemo } from 'react';
import { Transaction, MonthlyGoal } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip, LineChart, Line, CartesianGrid, Legend, XAxis, YAxis
} from 'recharts';
import { 
  ChevronLeft, ChevronRight, Target, 
  TrendingUp, TrendingDown, Calendar,
  AlertCircle, CheckCircle2
} from 'lucide-react';
import { format, subMonths, isSameMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';

interface SummaryProps {
  transactions: Transaction[];
}

export default function Summary({ transactions }: SummaryProps) {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [goal, setGoal] = useState<MonthlyGoal | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalValue, setGoalValue] = useState('');

  const monthKey = format(selectedMonth, 'yyyy-MM');

  // Fetch goal for current month
  useEffect(() => {
    async function fetchGoal() {
      if (!user) return;
      const { data, error } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', monthKey)
        .maybeSingle(); // Use maybeSingle to avoid 406 errors on empty results
      
      if (!error && data) {
        setGoal(data);
        setGoalValue(data.amount.toString());
      } else {
        setGoal(null);
        setGoalValue('');
      }
    }
    fetchGoal();
  }, [user, monthKey]);

  const handleSaveGoal = async () => {
    if (!user) return;
    const amount = parseFloat(goalValue);
    if (isNaN(amount)) return;

    const { data, error } = await supabase
      .from('monthly_goals')
      .upsert({
        user_id: user.id,
        month: monthKey,
        amount: amount
      }, { onConflict: 'user_id,month' })
      .select()
      .single();

    if (!error && data) {
      setGoal(data);
      setIsEditingGoal(false);
    }
  };

  // Filtered data for the selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => isSameMonth(parseISO(t.date), selectedMonth));
  }, [transactions, selectedMonth]);

  // Previous month data for comparison
  const prevMonthTransactions = useMemo(() => {
    const prevMonth = subMonths(selectedMonth, 1);
    return transactions.filter(t => isSameMonth(parseISO(t.date), prevMonth));
  }, [transactions, selectedMonth]);

  const stats = useMemo(() => {
    const income = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.value, 0);
    const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.value, 0);
    
    const prevIncome = prevMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.value, 0);
    const prevExpenses = prevMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.value, 0);

    const incomeTrend = prevIncome === 0 ? (income > 0 ? 100 : 0) : ((income - prevIncome) / prevIncome) * 100;
    const expenseTrend = prevExpenses === 0 ? (expenses > 0 ? 100 : 0) : ((expenses - prevExpenses) / prevExpenses) * 100;

    const topCategoryMap = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const current = acc[t.category] || 0;
        acc[t.category] = current + t.value;
        return acc;
      }, {} as Record<string, number>);

    const topCategoryName = Object.entries(topCategoryMap)
      .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || 'Nenhuma';

    return {
      income,
      expenses,
      balance: income - expenses,
      incomeTrend,
      expenseTrend,
      topCategoryName,
      progress: goal ? (expenses / goal.amount) * 100 : 0
    };
  }, [monthTransactions, prevMonthTransactions, goal]);

  // Evolution Data (Last 6 months)
  const evolutionData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(selectedMonth, 5 - i));
    return months.map(m => {
      const mStr = format(m, 'MMM', { locale: ptBR });
      const mTransactions = transactions.filter(t => isSameMonth(parseISO(t.date), m));
      return {
        name: mStr,
        income: mTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.value, 0),
        expense: mTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.value, 0),
      };
    });
  }, [transactions, selectedMonth]);

  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  const categoryData = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const existing = acc.find(item => item.category === t.category);
      if (existing) {
        existing.value += t.value;
      } else {
        acc.push({ category: t.category, value: t.value });
      }
      return acc;
    }, [] as { category: string; value: number }[])
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8 pb-12">
      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <button 
          onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
          className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-400" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-indigo-600" />
          <span className="font-bold text-gray-800 capitalize">
            {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
        </div>
        <button 
          onClick={() => setSelectedMonth(subMonths(selectedMonth, -1))}
          className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <ChevronRight size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Goal Progress Section */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-gray-800">Meta de Gastos</h3>
          </div>
          <button 
            onClick={() => setIsEditingGoal(!isEditingGoal)}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            {isEditingGoal ? 'Cancelar' : (goal ? 'Ajustar Meta' : 'Definir Meta')}
          </button>
        </div>

        {isEditingGoal ? (
          <div className="flex gap-2">
            <input 
              type="number"
              value={goalValue}
              onChange={(e) => setGoalValue(e.target.value)}
              placeholder="R$ 0,00"
              className="flex-1 bg-gray-50 border-none rounded-xl py-2 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
            />
            <button 
              onClick={handleSaveGoal}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
            >
              Salvar
            </button>
          </div>
        ) : goal ? (
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Progresso</p>
                <p className="text-lg font-black text-gray-900">
                  {formatCurrency(stats.expenses)} <span className="text-gray-300 font-normal text-xs">/ {formatCurrency(goal.amount)}</span>
                </p>
              </div>
              <div className={cn(
                "text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1",
                stats.progress > 100 ? "bg-rose-50 text-rose-600" : stats.progress > 85 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
              )}>
                {stats.progress > 100 ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                {Math.round(stats.progress)}%
              </div>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-1000 ease-out rounded-full",
                  stats.progress > 100 ? "bg-rose-500" : stats.progress > 85 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(stats.progress, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              {stats.progress > 100 
                ? `Você ultrapassou sua meta em ${formatCurrency(stats.expenses - goal.amount)}!`
                : `Você ainda pode gastar ${formatCurrency(goal.amount - stats.expenses)} este mês.`}
            </p>
          </div>
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-400">Nenhuma meta definida para este mês.</p>
          </div>
        )}
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Ganhos vs Mês Anterior</p>
          <div className="flex items-center gap-2">
            <p className={cn("text-lg font-black", stats.incomeTrend >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {stats.incomeTrend > 0 ? '+' : ''}{Math.round(stats.incomeTrend)}%
            </p>
            {stats.incomeTrend >= 0 ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-rose-500" />}
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Gastos vs Mês Anterior</p>
          <div className="flex items-center gap-2">
            <p className={cn("text-lg font-black", stats.expenseTrend > 0 ? "text-rose-600" : "text-emerald-600")}>
              {stats.expenseTrend > 0 ? '+' : ''}{Math.round(stats.expenseTrend)}%
            </p>
            {stats.expenseTrend > 0 ? <TrendingUp size={16} className="text-rose-500" /> : <TrendingDown size={16} className="text-emerald-500" />}
          </div>
        </div>
      </div>

      {/* Evolution Chart */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800 px-1">Evolução de 6 Meses</h3>
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="income" name="Ganhos" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="expense" name="Gastos" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Summary */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Maior Gasto no Mês</p>
          <h4 className="text-lg font-black text-gray-900">{stats.topCategoryName}</h4>
        </div>
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
          <TrendingDown size={24} />
        </div>
      </div>

      {/* Category Chart */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800 px-1">Gastos por Categoria</h3>
        {categoryData.length > 0 ? (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="h-48 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {categoryData.map((item, idx) => (
                <div key={item.category} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-sm font-medium text-gray-600">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(item.value)}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{Math.round((item.value / (stats.expenses || 1)) * 100)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] p-12 text-center text-gray-400 border-2 border-dashed border-gray-100">
            <AlertCircle className="mx-auto mb-2 text-gray-300" size={32} />
            <p className="text-sm font-medium">Nenhum dado para este mês.</p>
          </div>
        )}
      </div>
    </div>
  );
}
