import React from 'react';
import { FolderX, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionButton?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'এখানে কোনো ডেটা পাওয়া যায়নি',
  description,
  icon: Icon = FolderX,
  actionButton,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800/80 my-2">
      <div className="w-14 h-14 rounded-full bg-slate-800/70 border border-slate-700/50 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
        <Icon className="w-7 h-7 stroke-[1.5]" />
      </div>
      <h4 className="text-sm font-semibold text-slate-300">{title}</h4>
      {description && <p className="text-xs text-slate-400 max-w-sm mt-1">{description}</p>}
      {actionButton && <div className="mt-4">{actionButton}</div>}
    </div>
  );
};
