import { useState, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastOptions = {
  type?: "success" | "error" | "info";
  duration?: number | false;
};

type Toast = {
  id: string;
  message: React.ReactNode;
};

export const ToastContext = createContext<{
  toast: (message: React.ReactNode, params?: ToastOptions) => string | void;
  removeToast: (id: string) => void;
}>({
  toast: () => {},
  removeToast: () => {},
});

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (message: React.ReactNode, params?: ToastOptions) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message }]);

    if (params?.duration !== false) {
      setTimeout(() => {
        removeToast(id);
      }, params?.duration ?? 10000);
    }

    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      <ul className="fixed left-0 right-0 z-20 flex flex-col items-center gap-4 pointer-events-none top-4">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.li
              onClick={() => removeToast(t.id)}
              className="min-w-[200px] py-2 px-3 shadow-md text-slate-50 text-xs rounded-md bg-slate-800 dark:bg-slate-50 dark:text-slate-900 pointer-events-auto text-center cursor-pointer"
              key={t.id}
              layout
              initial={{ opacity: 0, y: -30, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            >
              {t.message}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {children}
    </ToastContext.Provider>
  );
};
