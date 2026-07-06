import React from 'react';
import { NewsEditor } from '../components/NewsEditor';
import { NewsCategory } from '../types';

interface Props {
  articleId?: string;
  categories: NewsCategory[];
  onClose: () => void;
  onSaveSuccess: () => void;
}

export function NewsEditorPage({ articleId, categories, onClose, onSaveSuccess }: Props) {
  return (
    <div className="space-y-6">
      <NewsEditor
        articleId={articleId}
        categories={categories}
        onClose={onClose}
        onSaveSuccess={onSaveSuccess}
      />
    </div>
  );
}
export default NewsEditorPage;
