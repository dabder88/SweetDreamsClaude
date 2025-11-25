
import React from 'react';
import { LayoutDashboard, BookOpen, BarChart2, Ghost, Settings, LogOut, User, Home } from 'lucide-react';
import { AppView, User as UserType } from '../types';
import { signOut } from '../services/authService';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  user: UserType | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, user }) => {

  const handleLogout = async () => {
    if (isSupabaseConfigured() && user) {
      await signOut();
    }
    onChangeView('landing');
  };
  
  const menuItems = [
    { id: 'landing', label: 'Главная', icon: Home },
    { id: 'dashboard', label: 'Обзор', icon: LayoutDashboard },
    { id: 'journal', label: 'Журнал снов', icon: BookOpen },
    { id: 'analytics', label: 'Аналитика', icon: BarChart2 },
    { id: 'archetypes', label: 'Архетипы', icon: Ghost },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  return (
    <aside className="w-full md:w-72 h-screen sticky top-0 flex flex-col border-r border-white/5 bg-slate-900/80 backdrop-blur-xl z-50">
      {/* Profile Section */}
      <div className="p-8 flex flex-col items-center border-b border-white/5">
        <div className="w-24 h-24 rounded-full p-1 border-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] mb-4 relative group cursor-pointer">
           <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden relative">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} className="text-indigo-300" />
              )}
              <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           </div>
           <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-4 border-slate-900 rounded-full" title="Онлайн"></div>
        </div>
        {user ? (
          <>
            <h3 className="text-white font-serif font-bold text-xl tracking-wide truncate w-full text-center" title={user.name || user.email}>
              {user.name || user.email.split('@')[0]}
            </h3>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-1">Искатель смыслов</span>
          </>
        ) : (
          <>
            <h3 className="text-white font-serif font-bold text-xl tracking-wide">Гость</h3>
            <span className="text-xs text-slate-500 mt-1">Локальный режим</span>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Меню</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as AppView)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-indigo-300'
                }
              `}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} />
              <span className="font-medium">{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
            </button>
          );
        })}
      </nav>

      {/* Footer Action */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-900/10 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">{user ? 'Выйти из аккаунта' : 'Выйти на главную'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
