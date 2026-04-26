import { Transaction } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { ArrowUpCircle, ArrowDownCircle, Search, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export default function TransactionList({ transactions, onDelete, compact }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center text-gray-400 space-y-4",
        compact ? "py-6" : "py-12"
      )}>
        {!compact && <Search size={48} strokeWidth={1.5} />}
        <p className="text-sm font-medium">Nenhum lançamento encontrado.</p>
      </div>
    );
  }

  // Group by date if not compact
  const grouped = transactions.sort((a, b) => b.date.localeCompare(a.date)).reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {} as Record<string, Transaction[]>);

  if (compact) {
    return (
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        {transactions.map((item, idx) => (
          <div 
            key={item.id} 
            className={cn(
              "flex items-center justify-between p-4 transition-colors group",
              idx !== transactions.length - 1 && "border-b border-gray-50"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-2 rounded-xl",
                item.type === 'income' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
              )}>
                {item.type === 'income' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm line-clamp-1">{item.description}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{format(parseISO(item.date), "d 'de' MMM", { locale: ptBR })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn(
                "font-bold text-sm whitespace-nowrap",
                item.type === 'income' ? "text-emerald-600" : "text-rose-600"
              )}>
                 {formatCurrency(item.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
            {format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {items.map((item, idx) => (
              <div 
                key={item.id} 
                className={cn(
                  "flex items-center justify-between p-4 transition-colors group",
                  idx !== items.length - 1 && "border-b border-gray-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-xl",
                    item.type === 'income' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                  )}>
                    {item.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{item.description}</h4>
                    <p className="text-xs text-gray-400">{item.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "font-bold text-sm",
                    item.type === 'income' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {item.type === 'income' ? '+' : '-'} {formatCurrency(item.value)}
                  </span>
                  {onDelete && (
                    <button 
                      onClick={() => onDelete(item.id)}
                      className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
