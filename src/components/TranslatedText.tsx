import React from 'react';
import { useTranslate } from '../hooks/useTranslate';

interface TranslatedTextProps {
  name: string;
  type: 'team' | 'country' | 'league' | 'stadium';
  className?: string;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({ name, type, className }) => {
  const translated = useTranslate(name, type);
  return <span className={className}>{translated}</span>;
};
