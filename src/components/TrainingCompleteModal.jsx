import React from 'react';
import { useTranslation } from 'react-i18next';

const TrainingCompleteModal = ({ open, onClose }) => {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-11/12 p-6 border border-gray-200 animate-scale-in overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none shimmer" />
        <div className="flex items-start gap-3 relative">
          <div className="text-3xl">�</div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">{t('trainingComplete.title')}</h2>
            <p className="text-gray-600 mb-4">{t('trainingComplete.body')}</p>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500 relative">
          {t('trainingComplete.note')}
        </div>
        <div className="mt-6 text-right relative">
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            onClick={onClose}
          >
            {t('trainingComplete.cta')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainingCompleteModal;
