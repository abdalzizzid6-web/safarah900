import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface PremiumPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PremiumPagination: React.FC<PremiumPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-3 bg-white/5 border border-white/5 rounded-2xl text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={18} />
      </button>
      
      <div className="flex items-center gap-1.5 px-4">
        {[...Array(totalPages)].map((_, i) => {
          const page = i + 1;
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`
                w-10 h-10 rounded-xl text-xs font-black transition-all border
                ${isActive 
                  ? 'bg-primary border-primary text-black' 
                  : 'bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10'}
              `}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-3 bg-white/5 border border-white/5 rounded-2xl text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={18} />
      </button>
    </div>
  );
};
