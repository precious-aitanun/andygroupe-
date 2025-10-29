import React, { useState, useEffect } from 'react';
import { Annotation } from '../types';
import { formatTimestamp } from '../utils/time';
import { SaveIcon, XMarkIcon } from './Icons';

interface AnnotationEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  annotation: Annotation | null; // null for new, existing for edit
  startTime: number | null;
  endTime: number | null;
}

const AnnotationEditorModal: React.FC<AnnotationEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  annotation,
  startTime,
  endTime,
}) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setText(annotation?.text || '');
    }
  }, [isOpen, annotation]);
  
  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    if (text.trim()) {
      onSave(text);
    }
  };

  const displayStartTime = annotation ? annotation.startTime : startTime;
  const displayEndTime = annotation ? annotation.endTime : endTime;

  return (
    <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        aria-modal="true"
        role="dialog"
    >
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] border border-slate-700">
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold">{annotation ? 'Edit Annotation' : 'New Annotation'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label="Close">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        
        <main className="p-4 flex-grow overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="bg-slate-700 p-3 rounded-md">
                  <span className="text-slate-400">Start Time:</span>
                  <span className="font-mono ml-2 text-white">{displayStartTime !== null ? formatTimestamp(displayStartTime) : '--:--.---'}</span>
              </div>
              <div className="bg-slate-700 p-3 rounded-md">
                  <span className="text-slate-400">End Time:</span>
                  <span className="font-mono ml-2 text-white">{displayEndTime !== null ? formatTimestamp(displayEndTime) : '--:--.---'}</span>
              </div>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Enter your annotation text here..."
            className="w-full h-64 bg-slate-900 border border-slate-600 rounded-md p-3 text-base focus:ring-2 focus:ring-sky-500 focus:outline-none resize-y"
            autoFocus
          />
        </main>
        
        <footer className="flex justify-end gap-3 p-4 border-t border-slate-700">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-semibold bg-slate-600 hover:bg-slate-500 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!text.trim()}
          >
            <SaveIcon className="w-5 h-5"/>
            Save
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AnnotationEditorModal;