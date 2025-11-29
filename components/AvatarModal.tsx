import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl: string;
  userName: string;
}

const AvatarModal: React.FC<AvatarModalProps> = ({ isOpen, onClose, avatarUrl, userName }) => {
  // Закрытие по Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Блокируем скролл body при открытом модальном окне
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Функция скачивания аватарки через fetch для работы с внешними URL
  const handleDownload = async () => {
    try {
      // Определяем расширение файла из URL
      const extension = avatarUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `avatar_${userName.replace(/\s+/g, '_')}.${extension}`;

      // Получаем изображение как blob
      const response = await fetch(avatarUrl, {
        mode: 'cors',
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error('Не удалось загрузить изображение');
      }

      const blob = await response.blob();

      // Создаем локальный URL для blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Создаем ссылку и триггерим скачивание
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Освобождаем память через небольшую задержку
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error('Ошибка при скачивании аватарки:', error);
      alert('Не удалось скачать изображение. Попробуйте открыть в новой вкладке.');
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full bg-slate-900/95 rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-serif font-bold text-white">Фото профиля</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-2"
              title="Скачать изображение"
            >
              <Download size={20} />
              <span className="hidden sm:inline text-sm font-medium">Скачать</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Закрыть"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="p-6 flex items-center justify-center bg-slate-950/50">
          <div className="relative max-w-full max-h-[70vh] rounded-xl overflow-hidden border-2 border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
            <img
              src={avatarUrl}
              alt={userName}
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/30 border-t border-white/5">
          <p className="text-sm text-slate-400 text-center">
            Нажмите ESC или кликните вне изображения для закрытия
          </p>
        </div>
      </div>
    </div>
  );

  // Используем Portal для рендеринга поверх всего приложения
  return createPortal(modalContent, document.body);
};

export default AvatarModal;
