import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, List, PieChart, PlusCircle, MinusCircle, LogOut, User } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'home' | 'list' | 'summary';
  onTabChange: (tab: 'home' | 'list' | 'summary') => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export default function Layout({ 
  children, 
  activeTab, 
  onTabChange, 
  onAddIncome, 
  onAddExpense 
}: LayoutProps) {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col max-w-md mx-auto relative shadow-2xl border-x border-gray-200">
      {/* Header */}
      <header className="bg-white border-bottom border-gray-100 py-4 px-6 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">
            $
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 leading-tight">Meus Gastos</h1>
            {profile && (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <User size={10} />
                {profile.name}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => signOut()}
            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
          <div className="w-[1px] h-6 bg-gray-100 mx-1" />
           <button 
            onClick={onAddIncome}
            className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
            title="Adicionar Ganho"
          >
            <PlusCircle size={24} />
          </button>
          <button 
            onClick={onAddExpense}
            className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-colors"
            title="Adicionar Gasto"
          >
            <MinusCircle size={24} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="px-6 py-4"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-100 py-3 px-8 fixed bottom-0 left-0 right-0 max-w-md mx-auto flex justify-between items-center z-10">
        <NavButton 
          active={activeTab === 'home'} 
          icon={<Home size={20} />} 
          label="Início" 
          onClick={() => onTabChange('home')} 
        />
        <NavButton 
          active={activeTab === 'list'} 
          icon={<List size={20} />} 
          label="Histórico" 
          onClick={() => onTabChange('list')} 
        />
        <NavButton 
          active={activeTab === 'summary'} 
          icon={<PieChart size={20} />} 
          label="Resumo" 
          onClick={() => onTabChange('summary')} 
        />
      </nav>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors",
        active ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}
