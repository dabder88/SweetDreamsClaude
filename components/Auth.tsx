import React, { useState } from 'react';
import { signIn, signUp, resetPassword } from '../services/authService';
import Button from './Button';
import { Mail, Lock, ArrowRight, Moon, Sparkles } from 'lucide-react';
import TiltCard from './TiltCard';

interface AuthProps {
  onAuthSuccess: () => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validation
    if (!email || !email.includes('@')) {
      setError('Введите корректный email');
      return;
    }

    if (mode !== 'reset' && !password) {
      setError('Введите пароль');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (mode !== 'reset' && password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const { user, error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else if (user) {
          onAuthSuccess();
        }
      } else if (mode === 'signup') {
        const { user, error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else if (user) {
          setSuccessMessage('Регистрация успешна! Проверьте email для подтверждения. После подтверждения войдите в систему.');
          // Do NOT call onAuthSuccess() - user must confirm email first
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          // Switch to signin mode after 3 seconds
          setTimeout(() => {
            switchMode('signin');
          }, 3000);
        }
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          setSuccessMessage('Ссылка для сброса пароля отправлена на ваш email');
          setEmail('');
        }
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative w-12 h-12 flex items-center justify-center bg-gradient-to-tr from-indigo-900 to-slate-900 rounded-lg border border-indigo-500/30 shadow-lg">
            <Moon size={24} className="text-indigo-300 absolute -top-1 -right-1 rotate-12" />
            <Sparkles size={16} className="text-purple-300 absolute bottom-2 left-2" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-slate-50 tracking-tight">PsyDream</h1>
        </div>

        <TiltCard className="glass-panel rounded-2xl p-8 bg-slate-900/50 border border-white/10">
          <h2 className="text-2xl font-serif font-bold text-white mb-2 text-center">
            {mode === 'signin' && 'Вход в систему'}
            {mode === 'signup' && 'Регистрация'}
            {mode === 'reset' && 'Сброс пароля'}
          </h2>
          <p className="text-slate-400 text-center mb-6">
            {mode === 'signin' && 'Войдите, чтобы продолжить анализ снов'}
            {mode === 'signup' && 'Создайте аккаунт для сохранения снов'}
            {mode === 'reset' && 'Мы отправим инструкции на ваш email'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Confirm Password */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Подтвердите пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">
                {successMessage}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full justify-center"
            >
              {loading ? (
                'Загрузка...'
              ) : (
                <>
                  {mode === 'signin' && 'Войти'}
                  {mode === 'signup' && 'Зарегистрироваться'}
                  {mode === 'reset' && 'Отправить ссылку'}
                  <ArrowRight size={18} className="ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Mode Switchers */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => switchMode('signup')}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Нет аккаунта? Зарегистрируйтесь
                </button>
                <br />
                <button
                  onClick={() => switchMode('reset')}
                  className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Забыли пароль?
                </button>
              </>
            )}
            {mode === 'signup' && (
              <button
                onClick={() => switchMode('signin')}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Уже есть аккаунт? Войдите
              </button>
            )}
            {mode === 'reset' && (
              <button
                onClick={() => switchMode('signin')}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Вернуться к входу
              </button>
            )}
          </div>
        </TiltCard>

        {/* Info Text */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Все ваши сны и анализы будут надежно сохранены в облаке
        </p>
      </div>
    </div>
  );
};

export default Auth;
