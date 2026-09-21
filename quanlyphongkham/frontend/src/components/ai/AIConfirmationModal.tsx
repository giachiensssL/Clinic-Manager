import { AlertTriangle, Check, X } from 'lucide-react';

interface AIConfirmationModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function AIConfirmationModal({ isOpen, message, onConfirm, onCancel, loading }: AIConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#0B3B78] mb-2">Yêu cầu xác nhận</h3>
          <p className="text-[#334155] text-sm leading-relaxed">{message}</p>
        </div>
        <div className="bg-slate-50 px-6 py-4 border-t border-[#E2E8F0] flex justify-end gap-3">
          <button 
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#334155] hover:bg-slate-200 rounded-lg transition-colors"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : (
              <>
                <Check className="w-4 h-4" /> Xác nhận
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
