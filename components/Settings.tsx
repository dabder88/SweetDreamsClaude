import React, { useState } from 'react';
import TiltCard from './TiltCard';
import Button from './Button';
import {
  User, Mail, Bell, Shield, Download, Trash2,
  CreditCard, Check, AlertTriangle, Moon, Globe
} from 'lucide-react';
import { getJournalEntries } from '../services/supabaseStorageService';

const Settings: React.FC = () => {
  const [loadingExport, setLoadingExport] = useState(false);

  // Mock toggle states
  const [notifications, setNotifications] = useState(true);
  const [englishMode, setEnglishMode] = useState(false);

  // --- ACTIONS ---

  const handleExportData = async () => {
    setLoadingExport(true);
    try {
      const data = await getJournalEntries();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `psydream_journal_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Ошибка при экспорте данных");
    } finally {
      setTimeout(() => setLoadingExport(false), 500);
    }
  };

  const handleClearData = () => {
    const confirmDelete = window.confirm(
      "ВНИМАНИЕ! Это удалит ВСЕ ваши записи журнала безвозвратно. Вы уверены?"
    );
    if (confirmDelete) {
      const doubleCheck = window.confirm("Вы действительно хотите стереть всю историю снов?");
      if (doubleCheck) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  // --- STYLES ---
  const sectionTitleStyle = "text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1";
  const cardStyle = "glass-panel p-6 rounded-2xl bg-slate-900/60 border border-slate-700/50";
  const inputStyle = "w-full bg-slate-950/80 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors";
  const labelStyle = "block text-sm text-slate-400 mb-2 font-medium";

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-white mb-2">Настройки</h2>
        <p className="text-slate-400">Управление аккаунтом и данными приложения</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Profile & Preferences */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Profile Section */}
          <div>
            <h3 className={sectionTitleStyle}>Учетная запись</h3>
            <TiltCard className={cardStyle}>
               <div className="flex items-start gap-6 mb-8">
                  <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center shrink-0">
                     <User size={32} className="text-indigo-300"/>
                  </div>
                  <div className="flex-1">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className={labelStyle}>Имя</label>
                           <div className="relative">
                              <User size={16} className="absolute left-3 top-3.5 text-slate-500"/>
                              <input type="text" value="Антон" readOnly className={`${inputStyle} pl-10 cursor-not-allowed opacity-70`} />
                           </div>
                        </div>
                        <div>
                           <label className={labelStyle}>Email</label>
                           <div className="relative">
                              <Mail size={16} className="absolute left-3 top-3.5 text-slate-500"/>
                              <input type="email" value="brainpinky@bk.ru" readOnly className={`${inputStyle} pl-10 cursor-not-allowed opacity-70`} />
                           </div>
                        </div>
                     </div>
                     <p className="text-xs text-slate-500 mt-3">
                        * Редактирование профиля временно недоступно в демо-режиме.
                     </p>
                  </div>
               </div>
            </TiltCard>
          </div>

          {/* Preferences Section */}
          <div>
            <h3 className={sectionTitleStyle}>Интерфейс и Уведомления</h3>
            <TiltCard className={`${cardStyle} space-y-6`}>
               
               {/* Language Toggle */}
               <div className="flex items-center justify-between pb-6 border-b border-slate-700/50">
                  <div className="flex items-center gap-4">
                     <div className="p-2bg-slate-800 rounded-lg text-indigo-400">
                        <Globe size={20} />
                     </div>
                     <div>
                        <h4 className="text-slate-200 font-medium">Язык интерфейса</h4>
                        <p className="text-sm text-slate-500">Текущий: Русский</p>
                     </div>
                  </div>
                  <button onClick={() => setEnglishMode(!englishMode)} className={`w-12 h-6 rounded-full relative transition-colors ${englishMode ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                     <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${englishMode ? 'left-7' : 'left-1'}`}></div>
                  </button>
               </div>

               {/* Notifications Toggle */}
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="bg-slate-800 rounded-lg text-amber-400">
                        <Bell size={20} />
                     </div>
                     <div>
                        <h4 className="text-slate-200 font-medium">Напоминания о записи снов</h4>
                        <p className="text-sm text-slate-500">Утренние пуш-уведомления</p>
                     </div>
                  </div>
                  <button onClick={() => setNotifications(!notifications)} className={`w-12 h-6 rounded-full relative transition-colors ${notifications ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                     <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications ? 'left-7' : 'left-1'}`}></div>
                  </button>
               </div>
            </TiltCard>
          </div>

          {/* Data Management Section */}
          <div>
            <h3 className={sectionTitleStyle}>Управление данными</h3>
            <TiltCard className={cardStyle}>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                     <div className="flex items-center gap-3">
                        <Download size={20} className="text-emerald-400"/>
                        <div>
                           <h4 className="text-slate-200 font-medium">Экспорт журнала</h4>
                           <p className="text-xs text-slate-500">Скачать все записи в формате JSON</p>
                        </div>
                     </div>
                     <Button variant="secondary" onClick={handleExportData} isLoading={loadingExport} className="text-sm py-2">
                        Скачать
                     </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-950/10 rounded-xl border border-red-900/30">
                     <div className="flex items-center gap-3">
                        <Trash2 size={20} className="text-red-400"/>
                        <div>
                           <h4 className="text-red-200 font-medium">Стереть все данные</h4>
                           <p className="text-xs text-red-400/60">Необратимое действие. Удалит локальное хранилище.</p>
                        </div>
                     </div>
                     <button 
                        onClick={handleClearData}
                        className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-900/20 hover:text-red-300 text-sm font-medium transition-colors"
                     >
                        Удалить
                     </button>
                  </div>
               </div>
            </TiltCard>
          </div>

        </div>

        {/* RIGHT COLUMN: Subscription & Info */}
        <div className="space-y-8">
          
          {/* Subscription Card */}
          <div>
             <h3 className={sectionTitleStyle}>Подписка</h3>
             <TiltCard className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-500/30 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <CreditCard size={100} />
                </div>
                
                <div className="relative z-10">
                   <div className="inline-block px-3 py-1 rounded bg-slate-700/50 text-slate-300 text-xs font-bold mb-4 border border-slate-600">
                      ТЕКУЩИЙ ПЛАН
                   </div>
                   <h3 className="text-2xl font-serif text-white mb-1">Free Plan</h3>
                   <p className="text-slate-400 text-sm mb-6">Базовые возможности толкования</p>

                   <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-2 text-sm text-slate-300">
                         <Check size={16} className="text-emerald-400"/> 3 толкования в день
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-300">
                         <Check size={16} className="text-emerald-400"/> Базовые архетипы
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-500 line-through decoration-slate-600">
                         <Check size={16} className="text-slate-600"/> Безлимитный AI
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-500 line-through decoration-slate-600">
                         <Check size={16} className="text-slate-600"/> Генерация 4K изображений
                      </li>
                   </ul>

                   <Button variant="primary" className="w-full">
                      Улучшить до PRO
                   </Button>
                </div>
             </TiltCard>
          </div>

          {/* Security Info */}
          <TiltCard className="glass-panel p-6 rounded-xl bg-slate-900/40 border border-slate-700/30">
              <div className="flex items-start gap-3">
                 <Shield size={20} className="text-emerald-400 mt-1"/>
                 <div>
                    <h4 className="text-slate-200 font-medium text-sm">Безопасность данных</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                       Ваши сны хранятся локально в вашем браузере. PsyDream не передает ваши личные записи на серверы для хранения.
                    </p>
                 </div>
              </div>
          </TiltCard>

          {/* Footer Info */}
          <div className="text-center">
             <p className="text-xs text-slate-600">PsyDream v1.2.0 (Beta)</p>
             <div className="flex justify-center gap-4 mt-2">
                <a href="#" className="text-xs text-slate-500 hover:text-indigo-400">Политика конфиденциальности</a>
                <a href="#" className="text-xs text-slate-500 hover:text-indigo-400">Условия использования</a>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;