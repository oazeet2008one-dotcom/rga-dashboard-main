import React from 'react';

type Props = {
  open: boolean;
  section: string | null;
  options: readonly string[];
  onSelect: (option: string) => void;
  onClose: () => void;
};

const DownloadOptionsModal: React.FC<Props> = ({ open, section, options, onSelect, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 text-center"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-1">
          <p className="text-[24px] font-semibold text-gray-900">Download options</p>
          <p className="text-[18px] text-gray-500">{section}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {options.map((option) => (
            <button
              key={option}
              className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              onClick={() => onSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DownloadOptionsModal;
