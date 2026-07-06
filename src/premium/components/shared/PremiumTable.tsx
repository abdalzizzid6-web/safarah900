import React from 'react';

interface PremiumTableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export const PremiumTable: React.FC<PremiumTableProps> = ({
  headers,
  children,
  className = ''
}) => {
  return (
    <div className={`w-full overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] ${className}`}>
      <table className="w-full text-right border-collapse">
        <thead className="bg-white/5 uppercase text-[10px] text-gray-500 font-black tracking-widest">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="p-6 text-right">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const PremiumTableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <tr className={`hover:bg-white/[0.02] transition-colors ${className}`}>
    {children}
  </tr>
);

export const PremiumTableCell: React.FC<{ children: React.ReactNode; className?: string; colSpan?: number }> = ({
  children,
  className = '',
  colSpan
}) => (
  <td colSpan={colSpan} className={`p-6 text-sm ${className}`}>
    {children}
  </td>
);
