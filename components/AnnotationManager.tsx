/// <reference lib="dom" />

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Annotation, NewAnnotation, Video } from '../types';
import { formatTimestamp } from '../utils/time';
import { exportAnnotationsToCSV, importAnnotationsFromCSV } from '../utils/csv';
import { exportAnnotationsToTXT } from '../utils/txt';
import { TrashIcon, DownloadIcon, EditIcon, CropIcon, PlusIcon, UploadIcon, SaveIcon, XMarkIcon } from './Icons';
import { spliceVideo } from '../utils/video';
import AnnotationEditorModal from './AnnotationEditorModal';

interface AnnotationManagerProps {
  video: Video;
  currentTime: number;
  getAnnotations: () => Promise<Annotation[]>;
  addAnnotation: (annotation: NewAnnotation) => Promise<Annotation>;
  addMultipleAnnotations: (annotations: NewAnnotation[]) => Promise<void>;
  updateAnnotation: (annotation: Annotation) => Promise<void>;
  deleteAnnotation: (annotationId: string) => Promise<void>;
  onSeek: (time: number) => void;
}

const AnnotationManager: React.FC<AnnotationManagerProps> = ({
  video,
  currentTime,
  getAnnotations,
  addAnnotation,
  addMultipleAnnotations,
  updateAnnotation,
  deleteAnnotation,
  onSeek,
}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [newStartTime, setNewStartTime] = useState<number | null>(null);
  const [newEndTime, setNewEndTime] = useState<number | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const [splicingAnnotationId, setSplicingAnnotationId] = useState<string | null>(null);
  const [spliceProgress, setSpliceProgress] = useState(0);
  const importInputRef = useRef<HTMLInputElement>(null);

  const fetchAnnotations = useCallback(async () => {
    const fetchedAnnotations = await getAnnotations();
    fetchedAnnotations.sort((a, b) => a.startTime - b.startTime);
    setAnnotations(fetchedAnnotations);
  }, [getAnnotations]);

  useEffect(() => {
    fetchAnnotations();
  }, [video.id, fetchAnnotations]);

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

  const handleSaveFromModal = async (text: string) => {
    if (!text.trim()) return;
  
    if (editingAnnotation) { // This is an update
      if (newStartTime === null || newEndTime === null) {
        alert("A valid start and end time must be set.");
        return;
      }
      if (newStartTime > newEndTime) {
          alert("Start time cannot be after end time.");
          return;
      }
      const updatedAnnotation = { 
          ...editingAnnotation, 
          startTime: newStartTime,
          endTime: newEndTime,
          text: text,
      };
      await updateAnnotation(updatedAnnotation);
    } else { // This is a new annotation
      if (newStartTime === null || newEndTime === null) return;
  
      if (newStartTime > newEndTime) {
          alert("Start time cannot be after end time.");
          return;
      }
  
      const newAnnotation: NewAnnotation = {
        videoId: video.id,
        startTime: newStartTime,
        endTime: newEndTime,
        text: text,
      };
      await addAnnotation(newAnnotation);
    }
    
    // Reset everything
    setIsModalOpen(false);
    setEditingAnnotation(null);
    setNewStartTime(null);
    setNewEndTime(null);
    fetchAnnotations();
  };

  const handleEdit = (annotation: Annotation) => {
    setEditingAnnotation(annotation);
    setNewStartTime(annotation.startTime);
    setNewEndTime(annotation.endTime);
  };
  
  const handleOpenNewAnnotationModal = () => {
    if (newStartTime === null || newEndTime === null) {
        alert("Please set a start and end time first.");
        return;
    }
    if (newStartTime > newEndTime) {
        alert("Start time cannot be after end time.");
        return;
    }
    setEditingAnnotation(null); // Ensure it's in "new" mode
    setIsModalOpen(true);
  }

  const handleCancelEdit = () => {
    setEditingAnnotation(null);
    setNewStartTime(null);
    setNewEndTime(null);
  };

  const handleOpenUpdateModal = () => {
    if (!editingAnnotation) return;
    if (newStartTime === null || newEndTime === null) return;

    if (newStartTime > newEndTime) {
        alert("Start time cannot be after end time.");
        return;
    }
    setIsModalOpen(true);
  }

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // If the modal was for editing, cancel the edit mode as well.
    if (editingAnnotation) {
      handleCancelEdit();
    }
  }

  const handleDelete = async (annotationId: string) => {
    if (window.confirm('Are you sure you want to delete this annotation?')) {
      // If deleting the annotation currently being edited, exit edit mode
      if (editingAnnotation?.id === annotationId) {
        handleCancelEdit();
      }
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

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedAnnotations = await importAnnotationsFromCSV(file);
      if (importedAnnotations.length === 0) {
        alert("No valid annotations found in the file.");
        return;
      }

      if (window.confirm(`Found ${importedAnnotations.length} annotations. Do you want to add them to this video? This cannot be undone.`)) {
        const annotationsWithVideoId = importedAnnotations.map(ann => ({ ...ann, videoId: video.id }));
        await addMultipleAnnotations(annotationsWithVideoId);
        await fetchAnnotations();
        alert("Annotations imported successfully!");
      }
    } catch (error) {
      console.error("Failed to import annotations:", error);
      alert(`Error importing annotations: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if(event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <>
      <div className="bg-gray-800 h-full flex flex-col rounded-lg">
        <div className="flex-shrink-0 flex justify-between items-center p-3 border-b border-gray-700">
          <h3 className="text-md font-semibold">Annotations</h3>
          <div className="flex items-center gap-1">
            <input type="file" accept=".csv" ref={importInputRef} onChange={handleFileImport} className="hidden" />
            <button onClick={handleImportClick} className="p-2 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white transition-colors" title="Import Annotations from CSV" >
              <UploadIcon className="w-5 h-5" />
            </button>
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
        </div>

        <div className="flex-grow overflow-y-auto p-3 space-y-3 min-h-0">
          {annotations.length === 0 ? (
            <p className="text-center text-gray-500 pt-8">No annotations yet.</p>
          ) : (
            annotations.map(ann => (
              <div key={ann.id} className={`relative bg-gray-700/50 p-3 rounded-lg text-sm group cursor-pointer hover:bg-gray-700 transition-colors ${editingAnnotation?.id === ann.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => onSeek(ann.startTime)}>
                <div>
                    <p className="font-mono text-blue-400 text-xs mb-1">{formatTimestamp(ann.startTime)} → {formatTimestamp(ann.endTime)}</p>
                    <p className="text-gray-200 whitespace-pre-wrap break-words">{ann.text}</p>
                </div>
                <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {splicingAnnotationId === ann.id ? (
                    <div className="flex items-center gap-2 px-2 py-1 text-gray-300 bg-gray-800/50 rounded-full">
                      <span className="text-xs font-mono w-9 text-center">{spliceProgress}%</span>
                      <div className="w-4 h-4 border-2 border-t-blue-500 border-gray-600 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleSpliceAndDownload(ann); }} className="p-1.5 rounded-full bg-gray-800/50 hover:bg-green-600 text-gray-300 hover:text-white" title="Download clip"><CropIcon className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(ann); }} className="p-1.5 rounded-full bg-gray-800/50 hover:bg-blue-600 text-gray-300 hover:text-white" title="Edit annotation"><EditIcon className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(ann.id); }} className="p-1.5 rounded-full bg-gray-800/50 hover:bg-red-600 text-gray-300 hover:text-white" title="Delete annotation"><TrashIcon className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex-shrink-0 p-3 border-t border-gray-700 bg-gray-900/50 rounded-b-lg">
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
          
          {editingAnnotation ? (
            <div className="mt-2">
              <p className="text-xs text-center text-gray-400 mb-2">
                Editing annotation. Use 'Set' to change times.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="w-full px-4 py-2.5 text-sm font-bold text-white bg-gray-600 hover:bg-gray-500 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <XMarkIcon className="w-5 h-5"/> Cancel
                </button>
                <button
                  onClick={handleOpenUpdateModal}
                  className="w-full px-4 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={newStartTime === null || newEndTime === null || newStartTime > newEndTime}
                >
                  <SaveIcon className="w-5 h-5"/> Save Changes
                </button>
              </div>
            </div>
          ) : (
            <button
                onClick={handleOpenNewAnnotationModal}
                className="w-full mt-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={newStartTime === null || newEndTime === null || newStartTime > newEndTime}
            >
                <PlusIcon className="w-5 h-5"/>
                Add Annotation
            </button>
          )}

        </div>
      </div>
      <AnnotationEditorModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveFromModal}
        annotation={editingAnnotation}
        startTime={editingAnnotation ? newStartTime : newStartTime}
        endTime={editingAnnotation ? newEndTime : newEndTime}
      />
    </>
  );
};

export default AnnotationManager;