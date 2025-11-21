import React from 'react';
import { CATEGORY_KEYWORDS, ChannelCategory } from '../types';

interface KeywordBankProps {
  category: ChannelCategory;
  onSelect: (keyword: string) => void;
}

export const KeywordBank: React.FC<KeywordBankProps> = ({ category, onSelect }) => {
  const keywords = CATEGORY_KEYWORDS[category] || [];

  if (keywords.length === 0) return null;

  return (
    <div className="mt-4 border-t border-zinc-800/50 pt-4">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
        <span className="text-blue-400">↳</span> Recommended {category} Sub-Niches
      </h3>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <button
            key={index}
            onClick={() => onSelect(keyword)}
            className="text-xs bg-zinc-800 hover:bg-blue-900/30 hover:text-blue-400 hover:border-blue-800 text-zinc-300 border border-zinc-700 px-3 py-1.5 rounded-full transition-colors duration-200"
          >
            {keyword.split('/')[0].trim()} 
          </button>
        ))}
      </div>
    </div>
  );
};