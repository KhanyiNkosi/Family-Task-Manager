// app/components/ToastNotification.tsx
"use client";

interface ToastNotificationProps {
  show: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function ToastNotification({ show, title, message, onClose }: ToastNotificationProps) {
  if (!show) return null;

  return (
    <div className="toast fixed bottom-8 right-8 bg-white p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] animate-[slideUp_0.3s_ease] z-[100]">
      <div className="font-extrabold mb-1.5">{title}</div>
      <div className="text-sm text-[#64748B]">{message}</div>
      <button 
        className="absolute top-3 right-3 text-[#64748B] hover:text-[#1A2D35]"
        onClick={onClose}
      >
        <i className="fas fa-times"></i>
      </button>
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
