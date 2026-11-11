import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, type, message }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 4000);
  }, []);
  const toast = useMemo(() => ({ success: (m) => push('success', m), error: (m) => push('error', m) }), [push]);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed right-4 top-4 z-[100] space-y-2">
        {items.map((t) => (
          <div key={t.id} className={`flex max-w-sm items-start gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${t.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {t.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}<span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
