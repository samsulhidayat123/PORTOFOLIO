'use client';

import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

type NoticeType = 'error' | 'success' | 'info' | 'warning';

type NoticeProps = {
  type?: NoticeType;
  title?: string;
  message: string;
  className?: string;
};

const noticeStyles: Record<NoticeType, string> = {
  error: 'border-red-600/70 bg-red-950/35 text-red-100',
  success: 'border-emerald-500/60 bg-emerald-950/30 text-emerald-100',
  info: 'border-zinc-700 bg-zinc-900/80 text-zinc-100',
  warning: 'border-amber-500/60 bg-amber-950/30 text-amber-100',
};

const iconStyles: Record<NoticeType, string> = {
  error: 'text-red-400',
  success: 'text-emerald-400',
  info: 'text-zinc-300',
  warning: 'text-amber-300',
};

const noticeIcons = {
  error: XCircle,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
};

export function Notice({ type = 'info', title, message, className = '' }: NoticeProps) {
  const Icon = noticeIcons[type];

  return (
    <div
      className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm shadow-lg shadow-black/20 ${noticeStyles[type]} ${className}`}
      role={type === 'error' ? 'alert' : 'status'}
    >
      <Icon size={18} className={`mt-0.5 flex-shrink-0 ${iconStyles[type]}`} />
      <div className="min-w-0">
        {title && <p className="mb-0.5 font-bold uppercase tracking-widest text-xs">{title}</p>}
        <p className="leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
