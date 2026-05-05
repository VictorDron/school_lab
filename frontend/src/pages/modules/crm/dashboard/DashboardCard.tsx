import React from 'react';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

export function DashboardCard({ title, subtitle, badge, children, className = '' }: DashboardCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-neutral-200 shadow-sm p-6 hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
          {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
        </div>
        {badge && (
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-medium px-2 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
