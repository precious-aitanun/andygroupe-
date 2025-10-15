import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Annotation, NewAnnotation, Video } from '../types';
import { formatTimestamp } from '../utils/time';
import { exportAnnotationsToCSV } from '../utils/csv';
import { exportAnnotationsToTXT } from '../utils/txt';
import { TrashIcon, DownloadIcon, EditIcon, SaveIcon, CropIcon } from './Icons';
import { spliceVideo } from '../utils/video';

interface AnnotationManagerProps {
  video: Video;
  currentTime: number;
  getAnnotations: () => Promise<Annotation[]>;
  addAnnotation: (annotation: NewAnnotation) => Promise<Annotation>;
  updateAnnotation: (annotation: Annotation) => Promise<void>;
  deleteAnnotation: (annotationId: string) => Promise<void>;
  onSeek: (time: number) => void;
}

const AnnotationManager: React.FC<AnnotationManagerProps> = ({
  video,
  currentTime,
  getAnnotations,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  onSeek,
}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [newStartTime, setNewStartTime] = useState<number | null>(null);
  const [newEndTime, setNewEndTime] = useState<number | null>(null);
  const [newAnnotationText, setNewAnnotationText] = useState('');
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const [splicingAnnotationId, setSplicingAnnotationId] = useState<string | null>(null);
  const [spliceProgress, setSpliceProgress] = useState(0);

  const fetchAnnotations = useCallback(async () => {
    const fetchedAnnotations = await getAnnotations();
    fetchedAnnotations.sort((a, b) => a.startTime - b.startTime);
    setAnnotations(fetchedAnnotations);
  }, [getAnnotations]);

  useEffect(() => {
    fetchAnnotations();
  }, [video.id, fetchAnnotations]);

  // Handle clicking outside the download menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSaveAnnotation = async () => {
    if (!newAnnotationText.trim() || newStartTime === null || newEndTime === null) return;

    if (newStartTime > newEndTime) {
        alert("Start time cannot be after end time.");
        return;
    }

    if (editingAnnotation) {
      const updatedAnnotation = { 
          ...editingAnnotation, 
          startTime: newStartTime,
          endTime: newEndTime,
          text: newAnnotationText
      };
      await updateAnnotation(updatedAnnotation);
      setEditingAnnotation(null);
    } else {
      const newAnnotation: NewAnnotation = {
        videoId: video.id,
        startTime: newStartTime,
        endTime: newEndTime,
        text: newAnnotationText,
      };
      await addAnnotation(newAnnotation);
    }
    setNewAnnotationText('');
    setNewStartTime(null);
    setNewEndTime(null);
    fetchAnnotations();
  };

  const handleEdit = (annotation: Annotation) => {
    setEditingAnnotation(annotation);
    setNewStartTime(annotation.startTime);
    setNewEndTime(annotation.endTime);
    setNewAnnotationText(annotation.text);
  };
  
  const handleCancelEdit = () => {
    setEditingAnnotation(null);
    setNewAnnotationText('');
    setNewStartTime(null);
    setNewEndTime(null);
  }

  const handleDelete = async (annotationId: string) => {
    if (window.confirm('Are you sure you want to delete this annotation?')) {
      await deleteAnnotation(annotationId);
      fetchAnnotations();
    }
  };

  const handleSpliceAndDownload = async (annotation: Annotation) => {
    if (splicingAnnotationId) return;

    setSplicingAnnotationId(annotation.id);
    setSpliceProgress(0);

    try {
      const videoBlob = await spliceVideo(
        video.file,
        annotation.startTime,
        annotation.endTime,
        (progress) => {
          setSpliceProgress(progress);
        }
      );

      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      const safeVideoName = video.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const startTimeFormatted = formatTimestamp(annotation.startTime).replace(/[:.]/g, '-');
      const endTimeFormatted = formatTimestamp(annotation.endTime).replace(/[:.]/g, '-');
      a.download = `${safeVideoName}_clip_${startTimeFormatted}_to_${endTimeFormatted}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to splice video:", error);
      alert("An error occurred while creating the video clip. Check the console for details.");
    } finally {
      setSplicingAnnotationId(null);
      setSpliceProgress(0);
    }
  };


  return (
    <div className="bg-gray-800 h-full flex flex-col rounded-lg">
      <div className="flex justify-between items-center p-3 border-b border-gray-700">
        <h3 className="text-md font-semibold">Annotations</h3>
        <div className="relative" ref={downloadMenuRef}>
          <button
            onClick={() => setIsDownloadMenuOpen(prev => !prev)}
            className="p-2 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            title="Download Annotations"
          >
            <DownloadIcon className="w-5 h-5" />
          </button>
          {isDownloadMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10 py-1 border border-gray-600">
              <button
                onClick={() => {
                  exportAnnotationsToCSV(annotations, video.name);
                  setIsDownloadMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600"
              >
                Download as CSV
              </button>
              <button
                onClick={() => {
                  exportAnnotationsToTXT(annotations, video.name);
                  setIsDownloadMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600"
              >
                Download as TXT
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-3 space-y-3">
        {annotations.length === 0 ? (
          <p className="text-center text-gray-500 pt-8">No annotations yet.</p>
        ) : (
          annotations.map(ann => (
            <div key={ann.id} className="bg-gray-700/50 p-3 rounded-lg text-sm group cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => onSeek(ann.startTime)}>
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                    <p className="font-mono text-blue-400 text-xs mb-1">{formatTimestamp(ann.startTime)} → {formatTimestamp(ann.endTime)}</p>
                    <p className="text-gray-200 whitespace-pre-wrap">{ann.text}</p>
                </div>
                <div className="flex-shrink-0 ml-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   {splicingAnnotationId === ann.id ? (
                    <div className="flex items-center gap-2 px-1 text-gray-300">
                      <span className="text-xs font-mono w-9 text-center">{spliceProgress}%</span>
                      <div className="w-4 h-4 border-2 border-t-blue-500 border-gray-600 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleSpliceAndDownload(ann); }} className="p-1.5 rounded-full hover:bg-green-500/50 text-gray-300 hover:text-white" title="Download clip"><CropIcon className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(ann); }} className="p-1.5 rounded-full hover:bg-blue-500/50 text-gray-300 hover:text-white" title="Edit annotation"><EditIcon className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(ann.id); }} className="p-1.5 rounded-full hover:bg-red-500/50 text-gray-300 hover:text-white" title="Delete annotation"><TrashIcon className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-gray-700 bg-gray-900/50 rounded-b-lg">
        <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
            <div className="bg-gray-700 p-2 rounded-md flex justify-between items-center">
                <div>
                    <span className="text-gray-400 text-xs">Start:</span>
                    <span className="font-mono ml-2 text-white">{newStartTime !== null ? formatTimestamp(newStartTime) : '--:--.---'}</span>
                </div>
                <button onClick={() => setNewStartTime(currentTime)} className="px-2 py-0.5 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors">Set</button>
            </div>
            <div className="bg-gray-700 p-2 rounded-md flex justify-between items-center">
                 <div>
                    <span className="text-gray-400 text-xs">End:</span>
                    <span className="font-mono ml-2 text-white">{newEndTime !== null ? formatTimestamp(newEndTime) : '--:--.---'}</span>
                </div>
                <button onClick={() => setNewEndTime(currentTime)} className="px-2 py-0.5 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors">Set</button>
            </div>
        </div>

        <textarea
          value={newAnnotationText}
          onChange={e => setNewAnnotationText(e.target.value)}
          placeholder="Add an annotation..."
          rows={2}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
        />
        <div className="flex justify-end gap-2 mt-2">
            {editingAnnotation && (
                <button onClick={handleCancelEdit} className="px-3 py-1.5 text-xs font-semibold bg-gray-600 hover:bg-gray-500 rounded-md transition-colors">
                    Cancel
                </button>
            )}
            <button
                onClick={handleSaveAnnotation}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newAnnotationText.trim() || newStartTime === null || newEndTime === null}
            >
                <SaveIcon className="w-4 h-4"/>
                {editingAnnotation ? 'Update' : 'Save'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AnnotationManager;