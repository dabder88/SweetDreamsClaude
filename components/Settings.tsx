import React, { useState, useEffect, useRef } from 'react';
import TiltCard from './TiltCard';
import Button from './Button';
import {
  User, Mail, Bell, Shield, Download, Trash2, Lock,
  CreditCard, Check, AlertTriangle, Moon, Globe, Camera, X, Edit2, Sparkles, FileText, UserX, Calendar, Users
} from 'lucide-react';
import { getJournalEntries, deleteAllUserData } from '../services/supabaseStorageService';
import { User as UserType, JournalEntry, AnalysisResponse } from '../types';
import {
  updatePassword,
  updateEmail,
  updateUserMetadata,
  uploadAvatar,
  deleteAvatar,
  getCurrentUser
} from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { visualizeDream } from '../services/geminiService';

interface SettingsProps {
  user: UserType | null;
  onUserUpdate: (user: UserType) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUserUpdate }) => {
  const [loadingExport, setLoadingExport] = useState(false);
  const [loadingExportTxt, setLoadingExportTxt] = useState(false);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Profile editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);

  const [isEditingGender, setIsEditingGender] = useState(false);
  const [gender, setGender] = useState(user?.gender || '');
  const [savingGender, setSavingGender] = useState(false);

  const [isEditingDateOfBirth, setIsEditingDateOfBirth] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState(user?.date_of_birth || '');
  const [savingDateOfBirth, setSavingDateOfBirth] = useState(false);

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
    setGender(user?.gender || '');
    setDateOfBirth(user?.date_of_birth || '');
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

  const handleExportTxt = async () => {
    setLoadingExportTxt(true);
    try {
      const entries = await getJournalEntries();

      if (entries.length === 0) {
        alert('Нет записей для экспорта');
        return;
      }

      // Format entries as readable text
      let txtContent = '═══════════════════════════════════════════════\n';
      txtContent += '          ЖУРНАЛ СНОВИДЕНИЙ - PSYDREAM\n';
      txtContent += '═══════════════════════════════════════════════\n\n';

      entries.forEach((entry, index) => {
        const date = new Date(entry.timestamp).toLocaleString('ru-RU');
        const analysis = typeof entry.analysis === 'string'
          ? entry.analysis
          : (entry.analysis as AnalysisResponse);

        txtContent += `\n${'─'.repeat(50)}\n`;
        txtContent += `ЗАПИСЬ №${index + 1}\n`;
        txtContent += `Дата: ${date}\n`;
        txtContent += `Метод: ${entry.dreamData.method}\n`;
        txtContent += `${'─'.repeat(50)}\n\n`;

        txtContent += `📝 ОПИСАНИЕ СНА:\n${entry.dreamData.description}\n\n`;

        if (typeof analysis !== 'string') {
          txtContent += `📊 КРАТКОЕ РЕЗЮМЕ:\n${analysis.summary}\n\n`;

          if (analysis.symbolism && analysis.symbolism.length > 0) {
            txtContent += `🔮 СИМВОЛЫ:\n`;
            analysis.symbolism.forEach(symbol => {
              txtContent += `\n  • ${symbol.name}:\n    ${symbol.meaning}\n`;
            });
            txtContent += '\n';
          }

          txtContent += `💭 АНАЛИЗ:\n${analysis.analysis}\n\n`;

          if (analysis.advice && analysis.advice.length > 0) {
            txtContent += `💡 РЕКОМЕНДАЦИИ:\n`;
            analysis.advice.forEach(advice => {
              txtContent += `  • ${advice}\n`;
            });
            txtContent += '\n';
          }
        } else {
          txtContent += `📖 АНАЛИЗ:\n${analysis}\n\n`;
        }

        if (entry.notes) {
          txtContent += `📌 ЗАМЕТКИ:\n${entry.notes}\n\n`;
        }
      });

      txtContent += `\n${'═'.repeat(50)}\n`;
      txtContent += `Всего записей: ${entries.length}\n`;
      txtContent += `Экспортировано: ${new Date().toLocaleString('ru-RU')}\n`;
      txtContent += `${'═'.repeat(50)}\n`;

      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `psydream_journal_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error:', e);
      alert('Ошибка при экспорте в TXT');
    } finally {
      setLoadingExportTxt(false);
    }
  };

  const handleClearData = async () => {
    const confirmDelete = window.confirm(
      "ВНИМАНИЕ! Это удалит ВСЕ ваши записи журнала и метаданные из Supabase. Вы уверены?"
    );
    if (!confirmDelete) return;

    const doubleCheck = window.confirm("Вы действительно хотите стереть всю историю снов? Это действие необратимо!");
    if (!doubleCheck) return;

    setClearingData(true);
    try {
      if (user) {
        await deleteAllUserData();
        alert('Все данные успешно удалены');
        window.location.reload();
      } else {
        localStorage.clear();
        window.location.reload();
      }
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Ошибка при удалении данных');
    } finally {
      setClearingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirm1 = window.confirm(
      "⚠️ ВНИМАНИЕ! Удаление аккаунта:\n\n" +
      "• Удалит ВСЕ ваши данные безвозвратно\n" +
      "• Удалит все записи снов\n" +
      "• Удалит аватар и настройки\n" +
      "• Это действие НЕОБРАТИМО\n\n" +
      "Вы действительно хотите удалить аккаунт?"
    );
    if (!confirm1) return;

    const confirm2 = window.confirm("Последнее подтверждение: удалить аккаунт НАВСЕГДА?");
    if (!confirm2) return;

    setDeletingAccount(true);
    try {
      // Delete all user data first
      await deleteAllUserData();

      // Delete user account
      const { error } = await supabase.rpc('delete_user');

      if (error) {
        // If RPC not available, just sign out (user will need to contact support)
        console.error('Delete user error:', error);
        alert('Не удалось удалить аккаунт автоматически. Пожалуйста, обратитесь в поддержку.');
      } else {
        alert('Аккаунт успешно удалён');
      }

      // Sign out and reload
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Ошибка при удалении аккаунта');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!user) return;

    setGeneratingAvatar(true);
    try {
      const entries = await getJournalEntries();

      if (entries.length === 0) {
        alert('Для генерации аватара нужен хотя бы один сохранённый сон');
        return;
      }

      // Get most recent dream or a random one
      const randomEntry = entries[Math.floor(Math.random() * entries.length)];

      // Create a metaphorical prompt based on dream symbols and themes
      const analysis = typeof randomEntry.analysis === 'string'
        ? null
        : (randomEntry.analysis as AnalysisResponse);

      let prompt = 'Создай абстрактный портрет-метафору на основе сновидения. ';

      if (analysis && analysis.symbolism && analysis.symbolism.length > 0) {
        const symbols = analysis.symbolism.slice(0, 3).map(s => s.name).join(', ');
        prompt += `Включи символы: ${symbols}. `;
      }

      prompt += `Эмоция сна: ${randomEntry.dreamData.context.emotion}. `;
      prompt += 'Стиль: сюрреалистический, мистический, как иллюстрация к сновидению. Без текста и надписей.';

      // Generate image using visualizeDream (it uses gemini-2.0-flash-exp)
      const mockDreamData = {
        description: prompt,
        context: randomEntry.dreamData.context,
        method: randomEntry.dreamData.method
      };

      const imageDataUrl = await visualizeDream(mockDreamData);

      if (!imageDataUrl) {
        alert('Не удалось сгенерировать изображение');
        return;
      }

      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'generated-avatar.png', { type: 'image/png' });

      // Delete old avatar if exists
      if (user.avatar_url) {
        await deleteAvatar(user.avatar_url);
      }

      // Upload new avatar
      const { url, error } = await uploadAvatar(file, user.id);
      if (error) {
        alert(error.message);
      } else if (url) {
        await updateUserMetadata({ avatar_url: url });
        const updatedUser = await getCurrentUser();
        if (updatedUser) {
          onUserUpdate(updatedUser);
        }
        alert('Аватар успешно сгенерирован на основе ваших снов! ✨');
      }
    } catch (error) {
      console.error('Avatar generation error:', error);
      alert('Ошибка при генерации аватара');
    } finally {
      setGeneratingAvatar(false);
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

  const handleSaveGender = async () => {
    if (!gender) {
      alert('Пол не может быть пустым');
      return;
    }

    setSavingGender(true);
    try {
      const { error } = await updateUserMetadata({
        gender: gender as 'male' | 'female'
      });
      if (error) {
        alert(error.message);
      } else {
        const updatedUser = await getCurrentUser();
        if (updatedUser) {
          onUserUpdate(updatedUser);
        }
        setIsEditingGender(false);
      }
    } catch (e) {
      alert('Ошибка сохранения пола');
    } finally {
      setSavingGender(false);
    }
  };

  const handleSaveDateOfBirth = async () => {
    if (!dateOfBirth) {
      alert('Дата рождения не может быть пустой');
      return;
    }

    setSavingDateOfBirth(true);
    try {
      const { error } = await updateUserMetadata({ date_of_birth: dateOfBirth });
      if (error) {
        alert(error.message);
      } else {
        const updatedUser = await getCurrentUser();
        if (updatedUser) {
          onUserUpdate(updatedUser);
        }
        setIsEditingDateOfBirth(false);
      }
    } catch (e) {
      alert('Ошибка сохранения даты рождения');
    } finally {
      setSavingDateOfBirth(false);
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

  const handleTogglePrivacy = async () => {
    if (!user || user.role !== 'admin') return;

    const newPrivacyValue = !user.privacy_hide_dreams;

    // Optimistically update UI immediately
    onUserUpdate({
      ...user,
      privacy_hide_dreams: newPrivacyValue
    });

    setSavingPrivacy(true);
    try {
      const { error } = await updateUserMetadata({
        privacy_hide_dreams: newPrivacyValue
      });

      if (error) {
        // Revert on error
        onUserUpdate({
          ...user,
          privacy_hide_dreams: !newPrivacyValue
        });
        alert(error.message);
        setSavingPrivacy(false);
        return;
      }

      // Force session refresh to sync with backend
      await supabase.auth.refreshSession();

      if (newPrivacyValue) {
        alert('✅ История снов скрыта от других администраторов');
      } else {
        alert('✅ История снов теперь видна администраторам');
      }
    } catch (e) {
      console.error('Privacy toggle error:', e);
      // Revert on error
      onUserUpdate({
        ...user,
        privacy_hide_dreams: !newPrivacyValue
      });
      alert('Ошибка изменения настроек приватности');
    } finally {
      setSavingPrivacy(false);
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
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    {/* Avatar */}
                    <div className="relative">
                      <div
                        className={`w-20 h-20 rounded-full border-2 border-indigo-500 flex items-center justify-center overflow-hidden bg-slate-800 ${uploadingAvatar || deletingAvatar || generatingAvatar ? 'opacity-50' : ''}`}
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

                      {/* Small Avatar Actions */}
                      <div className="absolute -bottom-1 -right-1 flex gap-1">
                        <button
                          onClick={handleAvatarClick}
                          disabled={uploadingAvatar || deletingAvatar || generatingAvatar}
                          className="p-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
                          title="Загрузить аватар"
                        >
                          <Camera size={14} />
                        </button>
                        {user?.avatar_url && (
                          <button
                            onClick={handleDeleteAvatar}
                            disabled={uploadingAvatar || deletingAvatar || generatingAvatar}
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

                    {/* Generate Avatar Button */}
                    <button
                      onClick={handleGenerateAvatar}
                      disabled={uploadingAvatar || deletingAvatar || generatingAvatar}
                      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                      title="Сгенерировать аватар на основе ваших снов"
                    >
                      {generatingAvatar ? (
                        <>
                          <div className="animate-spin">
                            <Sparkles size={14} />
                          </div>
                          <span>Генерация...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>Создать из снов</span>
                        </>
                      )}
                    </button>
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

                        {/* Gender */}
                        <div>
                           <label className={labelStyle}>Пол</label>
                           {isEditingGender ? (
                             <div className="flex gap-2">
                               <div className="relative flex-1">
                                 <Users size={16} className="absolute left-3 top-3.5 text-slate-500"/>
                                 <select
                                   value={gender}
                                   onChange={(e) => setGender(e.target.value)}
                                   className={`${inputStyle} pl-10`}
                                   disabled={savingGender}
                                 >
                                   <option value="">Выберите пол</option>
                                   <option value="male">Мужской</option>
                                   <option value="female">Женский</option>
                                 </select>
                               </div>
                               <button
                                 onClick={handleSaveGender}
                                 disabled={savingGender}
                                 className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
                                 title="Сохранить"
                               >
                                 {savingGender ? '...' : <Check size={16} />}
                               </button>
                               <button
                                 onClick={() => {
                                   setIsEditingGender(false);
                                   setGender(user?.gender || '');
                                 }}
                                 disabled={savingGender}
                                 className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                                 title="Отменить"
                               >
                                 <X size={16} />
                               </button>
                             </div>
                           ) : (
                             <div className="flex gap-2">
                               <div className="relative flex-1">
                                 <Users size={16} className="absolute left-3 top-3.5 text-slate-500"/>
                                 <div className={`${inputStyle} pl-10 cursor-not-allowed opacity-70`}>
                                   {user?.gender === 'male' ? 'Мужской' :
                                    user?.gender === 'female' ? 'Женский' :
                                    'Не указано'}
                                 </div>
                               </div>
                               <button
                                 onClick={() => setIsEditingGender(true)}
                                 className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                 title="Редактировать"
                               >
                                 <Edit2 size={16} />
                               </button>
                             </div>
                           )}
                        </div>

                        {/* Date of Birth */}
                        <div>
                           <label className={labelStyle}>Дата рождения</label>
                           {isEditingDateOfBirth ? (
                             <div className="flex gap-2">
                               <div className="relative flex-1">
                                 <Calendar size={16} className="absolute left-3 top-3.5 text-slate-500"/>
                                 <input
                                   type="date"
                                   value={dateOfBirth}
                                   onChange={(e) => setDateOfBirth(e.target.value)}
                                   className={`${inputStyle} pl-10`}
                                   disabled={savingDateOfBirth}
                                   max={new Date().toISOString().split('T')[0]}
                                 />
                               </div>
                               <button
                                 onClick={handleSaveDateOfBirth}
                                 disabled={savingDateOfBirth}
                                 className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
                                 title="Сохранить"
                               >
                                 {savingDateOfBirth ? '...' : <Check size={16} />}
                               </button>
                               <button
                                 onClick={() => {
                                   setIsEditingDateOfBirth(false);
                                   setDateOfBirth(user?.date_of_birth || '');
                                 }}
                                 disabled={savingDateOfBirth}
                                 className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                                 title="Отменить"
                               >
                                 <X size={16} />
                               </button>
                             </div>
                           ) : (
                             <div className="flex gap-2">
                               <div className="relative flex-1">
                                 <Calendar size={16} className="absolute left-3 top-3.5 text-slate-500"/>
                                 <div className={`${inputStyle} pl-10 cursor-not-allowed opacity-70`}>
                                   {user?.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('ru-RU') : 'Не указано'}
                                 </div>
                               </div>
                               <button
                                 onClick={() => setIsEditingDateOfBirth(true)}
                                 className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                 title="Редактировать"
                               >
                                 <Edit2 size={16} />
                               </button>
                             </div>
                           )}
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

          {/* Data Management Section */}
          <div>
            <h3 className={sectionTitleStyle}>Управление данными</h3>
            <TiltCard className={cardStyle}>
               <div className="space-y-4">
                  {/* Export JSON */}
                  <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                     <div className="flex items-center gap-3">
                        <Download size={20} className="text-emerald-400"/>
                        <div>
                           <h4 className="text-slate-200 font-medium">Экспорт в JSON</h4>
                           <p className="text-xs text-slate-500">Скачать все записи для backup</p>
                        </div>
                     </div>
                     <Button variant="secondary" onClick={handleExportData} isLoading={loadingExport} className="text-sm py-2">
                        JSON
                     </Button>
                  </div>

                  {/* Export TXT */}
                  <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                     <div className="flex items-center gap-3">
                        <FileText size={20} className="text-blue-400"/>
                        <div>
                           <h4 className="text-slate-200 font-medium">Экспорт в TXT</h4>
                           <p className="text-xs text-slate-500">Читаемый текстовый формат</p>
                        </div>
                     </div>
                     <Button variant="secondary" onClick={handleExportTxt} isLoading={loadingExportTxt} className="text-sm py-2">
                        TXT
                     </Button>
                  </div>

                  {/* Clear All Data */}
                  <div className="flex items-center justify-between p-4 bg-orange-950/10 rounded-xl border border-orange-900/30">
                     <div className="flex items-center gap-3">
                        <Trash2 size={20} className="text-orange-400"/>
                        <div>
                           <h4 className="text-orange-200 font-medium">Стереть все данные</h4>
                           <p className="text-xs text-orange-400/60">Удалит все записи и статистику из Supabase</p>
                        </div>
                     </div>
                     <Button
                        variant="secondary"
                        onClick={handleClearData}
                        isLoading={clearingData}
                        className="text-sm py-2 border-orange-500/30 text-orange-400 hover:bg-orange-900/20"
                     >
                        Очистить
                     </Button>
                  </div>

                  {/* Delete Account */}
                  {user && (
                    <div className="flex items-center justify-between p-4 bg-red-950/10 rounded-xl border border-red-900/30">
                       <div className="flex items-center gap-3">
                          <UserX size={20} className="text-red-400"/>
                          <div>
                             <h4 className="text-red-200 font-medium">Удалить аккаунт</h4>
                             <p className="text-xs text-red-400/60">Необратимое удаление аккаунта и всех данных</p>
                          </div>
                       </div>
                       <Button
                          variant="secondary"
                          onClick={handleDeleteAccount}
                          isLoading={deletingAccount}
                          className="text-sm py-2 border-red-500/30 text-red-400 hover:bg-red-900/20"
                       >
                          Удалить
                       </Button>
                    </div>
                  )}
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
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield size={20} className="text-emerald-400 mt-1"/>
                  <div>
                    <h4 className="text-slate-200 font-medium text-sm">Безопасность данных</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Ваши сны защищены Row Level Security в Supabase. Только вы имеете доступ к своим записям.
                    </p>
                  </div>
                </div>

                {/* Privacy Toggle for Admins */}
                {user?.role === 'admin' && (
                  <div className="pt-4 border-t border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-slate-200 font-medium text-sm flex items-center gap-2">
                          <Lock size={16} className="text-purple-400"/>
                          Приватность админа
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Скрыть историю снов и аналитику от других администраторов
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleTogglePrivacy}
                        disabled={savingPrivacy}
                        aria-label="Переключить приватность снов"
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                          user.privacy_hide_dreams
                            ? 'bg-purple-600'
                            : 'bg-slate-600'
                        } ${savingPrivacy ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            user.privacy_hide_dreams ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    {user.privacy_hide_dreams && (
                      <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <p className="text-xs text-purple-300 flex items-center gap-2">
                          <Check size={12} />
                          Ваша история снов скрыта от других админов
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
