import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: { id: string; text: string; type: string }; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons: Record<string, any> = {
    success: <CheckCircle2 className="text-green-400 shrink-0" size={20} />,
    error: <AlertTriangle className="text-red-400 shrink-0" size={20} />,
    info: <Info className="text-cyan-400 shrink-0" size={20} />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="pointer-events-auto flex items-center justify-between p-4 rounded-xl border border-white/10 bg-slate-900/90 text-white backdrop-blur-xl shadow-2xl"
    >
      <div className="flex items-center gap-3">
        {icons[toast.type] || icons.info}
        <span className="text-sm font-medium pr-2">{toast.text}</span>
      </div>
      <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </motion.div>
  );
};