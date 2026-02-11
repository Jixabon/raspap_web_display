import { useEffect } from 'preact/hooks';

export default function Modal({ isOpen, onClose = null, title = '', children, showClose = true, showTitle = true }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
        <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        />

        {/* Modal box */}
        <div className="relative bg-white dark:bg-dark-blue rounded-lg shadow-xl max-w-lg mx-6 animate-fade-in">
            <div className={`flex items-center ${!showClose ? 'justify-center' : 'justify-between'} p-6`}>
                <h2 className="text-2xl font-semibold">{title}</h2>
                {showClose && (
                    <button
                        onClick={onClose}
                    >
                        <i className="fa-solid fa-times text-2xl"></i>
                    </button>
                )}
            </div>

            <div className="px-6 pb-6">
            {children}
            </div>
        </div>
    </div>
  );
}
