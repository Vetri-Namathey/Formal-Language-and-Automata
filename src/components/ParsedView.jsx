import React from 'react';
import { useTranslation } from 'react-i18next';

const Row = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-1">
    <div className="sm:w-40 text-sm font-medium text-gray-600">{label}</div>
    <div className="flex-1 text-sm text-gray-800 break-words">{value || '—'}</div>
  </div>
);

export default function ParsedView({ original, translated, normalized, tokens, parsedCommand }) {
  const { t } = useTranslation();
  const tokenStr = Array.isArray(tokens) ? tokens.join(' | ') : '';
  
  // Format the parsed command in a more readable way
  const formatParsedCommand = (cmd) => {
    if (!cmd) return '';
    const { action, article, size, color, type, category, id, ...rest } = cmd;
    const parts = [];
    if (action) parts.push(`${action}`);
    if (article) parts.push(`${article}`);
    if (size) parts.push(`${size}`);
    if (color && color !== '#333333') parts.push(`${color}`);
    if (type) parts.push(`${type}`);
    if (category) parts.push(`(${category})`);
    return parts.join(' ');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <h3 className="text-lg font-semibold mb-3">{t('parsedView.title')}</h3>
      <div className="space-y-1">
        <Row label={t('parsedView.original')} value={original} />
        <Row label={t('parsedView.translated')} value={translated} />
        <Row label={t('parsedView.normalized')} value={normalized} />
        <Row label={t('parsedView.tokens')} value={tokenStr} />
        <Row 
          label={t('parsedView.parsed')} 
          value={
            parsedCommand ? (
              <div className="font-mono bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap">
                {formatParsedCommand(parsedCommand)}
              </div>
            ) : '—'
          } 
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">{t('parsedView.note')}</p>
    </div>
  );
}
