import React, { useState, useEffect, useRef } from 'react';
import TiltCard from './TiltCard';
import Button from './Button';
import {
  User, Mail, Bell, Shield, Download, Trash2, Lock,
  CreditCard, Check, AlertTriangle, Moon, Globe, Camera, X, Edit2
} from 'lucide-react';
import { getJournalEntries } from '../services/supabaseStorageService';
import { User as UserType } from '../types';
import {
  updatePassword,
  updateEmail,
  updateUserMetadata,
  uploadAvatar,
  deleteAvatar,
  getCurrentUser
} from '../services/authService';

interface SettingsProps {
  user: UserType | null;
  onUserUpdate: (user: UserType) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUserUpdate }) => {
  const [loadingExport, setLoadingExport] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [englishMode, setEnglishMode] = useState(false);

  // Profile editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);

  // Avatar states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Email change states
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
  }, [user]);

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

  const handleSaveName = async () => {
    if (!name.trim()) {
      alert('Имя не может быть пустым');
      return;
    }

    setSavingName(true);
    try {
      const { error } = await updateUserMetadata({ name: name.trim() });
      if (error) {
        alert(error.message);
      } else {
        // Refresh user data
        const updatedUser = await getCurrentUser();
        if (updatedUser) {
          onUserUpdate(updatedUser);
        }
        setIsEditingName(false);
      }
    } catch (e) {
      alert('Ошибка сохранения имени');
    } finally {
      setSavingName(false);
    }
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Размер файла не должен превышать 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      // Delete old avatar if exists
      if (user.avatar_url) {
        await deleteAvatar(user.avatar_url);
      }

      // Upload new avatar
      const { url, error } = await uploadAvatar(file, user.id);
      if (error) {
        alert(error.message);
      } else if (url) {
        // Update user metadata
        await updateUserMetadata({ avatar_url: url });

        // Refresh user data
        const updatedUser = await getCurrentUser();
        if (updatedUser) {
          onUserUpdate(updatedUser);
        }
      }
    } catch (e) {
      alert('Ошибка загрузки аватара');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user?.avatar_url) return;

    const confirm = window.confirm('Удалить аватар?');
    if (!confirm) return;

    setDeletingAvatar(true);
    try {
      const { error: deleteError } = await deleteAvatar(user.avatar_url);
      if (deleteError) {
        alert(deleteError.message);
        return;
      }

      // Update user metadata
      const { error: updateError } = await updateUserMetadata({ avatar_url: '' });
      if (updateError) {
        alert(updateError.message);
      } else {
        // Refresh user data
        const updatedUser = await getCurrentUser();
        if (updatedUser) {
          onUserUpdate(updatedUser);
        }
      }
    } catch (e) {
      alert('Ошибка удаления аватара');
    } finally {
      setDeletingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('Пароль должен быть не менее 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordForm(false);
          setPasswordSuccess(false);
        }, 2000);
      }
    } catch (e) {
      setPasswordError('Ошибка смены пароля');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    setEmailError('');
    setEmailSuccess(false);

    if (!newEmail.includes('@')) {
      setEmailError('Неверный формат email');
      return;
    }

    setSavingEmail(true);
    try {
      const { error } = await updateEmail(newEmail);
      if (error) {
        setEmailError(error.message);
      } else {
        setEmailSuccess(true);
        setNewEmail('');
        setTimeout(() => {
          setShowEmailForm(false);
          setEmailSuccess(false);
        }, 3000);
      }
    } catch (e) {
      setEmailError('Ошибка смены email');
    } finally {
      setSavingEmail(false);
    }
  };

  // --- STYLES ---
  const sectionTitleStyle = "text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1";
  const cardStyle = "glass-panel p-6 rounded-2xl bg-slate-900/60 border border-slate-700/50";
  const inputStyle = "w-full bg-slate-950/80 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors";
  const labelStyle = "block text-sm text-slate-400 mb-2 font-medium";

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
  };

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
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-20 h-20 rounded-full border-2 border-indigo-500 flex items-center justify-center overflow-hidden bg-slate-800 ${uploadingAvatar || deletingAvatar ? 'opacity-50' : ''}`}
                    >
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={32} className="text-indigo-300"/>
                      )}
                    </div>

                    {/* Avatar Actions */}
                    <div className="absolute -bottom-1 -right-1 flex gap-1">
                      <button
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar || deletingAvatar}
                        className="p-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
                        title="Загрузить аватар"
                      >
                        <Camera size={14} />
                      </button>
                      {user?.avatar_url && (
                        <button
                          onClick={handleDeleteAvatar}
                          disabled={uploadingAvatar || deletingAvatar}
                          className="p-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
                          title="Удалить аватар"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div>
                           <label className={labelStyle}>Имя</label>
                           {isEditingName ? (
                             <div className="flex gap-2">
                               <div className="relative flex-1">
                                 <User size={16} className="absolute left-3 top-3.5 text-slate-500"/>
                                 <input
                                   type="text"
                                   value={name}
                                   onChange={(e) => setName(e.target.value)}
                                   className={`${inputStyle} pl-10`}
                                   placeholder="Ваше имя"
                                   disabled={savingName}
                                 />
                               </div>
                               <button
                                 onClick={handleSaveName}
                                 disabled={savingName}
                                 className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
                               >
                                 {savingName ? '...' : <Check size={16} />}
                               </button>
                               <button
                                 onClick={() => {
                                   setIsEditingName(false);
                                   setName(user?.name || '');
                                 }}
                                 disabled={savingName}
                                 className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                               >
                                 <X size={16} />
                               </button>
                             </div>
                           ) : (
                             <div className="flex gap-2">
                               <div className="relative flex-1">
                                 <User size={16} className="absolute left-3 top-3.5 text-slate-500"/>
                                 <div className={`${inputStyle} pl-10 cursor-not-allowed opacity-70`}>
                                   {user?.name || 'Не указано'}
                                 </div>
                               </div>
                               <button
                                 onClick={() => setIsEditingName(true)}
                                 className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                               >
                                 <Edit2 size={16} />
                               </button>
                             </div>
                           )}
                        </div>

                        {/* Email */}
                        <div>
                           <label className={labelStyle}>Email</label>
                           <div className="relative">
                              <Mail size={16} className="absolute left-3 top-3.5 text-slate-500"/>
                              <div className={`${inputStyle} pl-10 cursor-not-allowed opacity-70`}>
                                {user?.email}
                              </div>
                           </div>
                        </div>
                     </div>

                     <p className="text-xs text-slate-500 mt-3">
                        Дата регистрации: {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                     </p>
                  </div>
               </div>

               {/* Password Change */}
               <div className="mb-6 pb-6 border-b border-slate-700/50">
                 <div className="flex items-center justify-between mb-3">
                   <h4 className="text-sm font-bold text-slate-300">Изменить пароль</h4>
                   <button
                     onClick={() => setShowPasswordForm(!showPasswordForm)}
                     className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                   >
                     {showPasswordForm ? 'Отмена' : 'Изменить'}
                   </button>
                 </div>

                 {showPasswordForm && (
                   <div className="space-y-3 animate-fade-in">
                     <div>
                       <input
                         type="password"
                         value={newPassword}
                         onChange={(e) => setNewPassword(e.target.value)}
                         placeholder="Новый пароль (мин. 6 символов)"
                         className={inputStyle}
                         disabled={savingPassword}
                       />
                     </div>
                     <div>
                       <input
                         type="password"
                         value={confirmPassword}
                         onChange={(e) => setConfirmPassword(e.target.value)}
                         placeholder="Подтвердите пароль"
                         className={inputStyle}
                         disabled={savingPassword}
                       />
                     </div>
                     {passwordError && (
                       <p className="text-xs text-red-400 flex items-center gap-1">
                         <AlertTriangle size={12} /> {passwordError}
                       </p>
                     )}
                     {passwordSuccess && (
                       <p className="text-xs text-emerald-400 flex items-center gap-1">
                         <Check size={12} /> Пароль успешно изменён
                       </p>
                     )}
                     <Button
                       variant="primary"
                       onClick={handleChangePassword}
                       isLoading={savingPassword}
                       className="text-sm py-2"
                     >
                       Сохранить пароль
                     </Button>
                   </div>
                 )}
               </div>

               {/* Email Change */}
               <div>
                 <div className="flex items-center justify-between mb-3">
                   <h4 className="text-sm font-bold text-slate-300">Изменить Email</h4>
                   <button
                     onClick={() => setShowEmailForm(!showEmailForm)}
                     className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                   >
                     {showEmailForm ? 'Отмена' : 'Изменить'}
                   </button>
                 </div>

                 {showEmailForm && (
                   <div className="space-y-3 animate-fade-in">
                     <div>
                       <input
                         type="email"
                         value={newEmail}
                         onChange={(e) => setNewEmail(e.target.value)}
                         placeholder="Новый email"
                         className={inputStyle}
                         disabled={savingEmail}
                       />
                     </div>
                     {emailError && (
                       <p className="text-xs text-red-400 flex items-center gap-1">
                         <AlertTriangle size={12} /> {emailError}
                       </p>
                     )}
                     {emailSuccess && (
                       <p className="text-xs text-emerald-400 flex items-center gap-1">
                         <Check size={12} /> Письмо с подтверждением отправлено на новый email
                       </p>
                     )}
                     <Button
                       variant="primary"
                       onClick={handleChangeEmail}
                       isLoading={savingEmail}
                       className="text-sm py-2"
                     >
                       Изменить Email
                     </Button>
                     <p className="text-xs text-slate-500">
                       После смены на новый email будет отправлено письмо с подтверждением
                     </p>
                   </div>
                 )}
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
                     <div className="p-2 bg-slate-800 rounded-lg text-indigo-400">
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
                     <div className="bg-slate-800 rounded-lg text-amber-400 p-2">
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
                       Ваши сны защищены Row Level Security в Supabase. Только вы имеете доступ к своим записям.
                    </p>
                 </div>
              </div>
          </TiltCard>

          {/* Footer Info */}
          <div className="text-center">
             <p className="text-xs text-slate-600">PsyDream v1.3.0 (Beta)</p>
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
