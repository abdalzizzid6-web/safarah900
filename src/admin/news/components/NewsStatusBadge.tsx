import React from 'react';
import { NewsArticleStatus } from '../types';

interface Props {
  status: NewsArticleStatus;
}

export function NewsStatusBadge({ status }: Props) {
  let bg = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  let text = 'مسودة';

  switch (status) {
    case NewsArticleStatus.PUBLISHED:
      bg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      text = 'منشور';
      break;
    case NewsArticleStatus.DRAFT:
      bg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      text = 'مسودة';
      break;
    case NewsArticleStatus.SCHEDULED:
      bg = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      text = 'مجدول';
      break;
    case NewsArticleStatus.REVIEW:
      bg = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      text = 'مراجعة';
      break;
    case NewsArticleStatus.APPROVED:
      bg = 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      text = 'معتمد';
      break;
    case NewsArticleStatus.ARCHIVED:
      bg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      text = 'مؤرشف';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${bg}`}>
      {text}
    </span>
  );
}
