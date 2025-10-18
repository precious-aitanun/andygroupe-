import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Video, Annotation, NewAnnotation } from '../types';
import VideoPlayer, { VideoPlayerHandles } from './VideoPlayer';
import AnnotationManager from './AnnotationManager';
import FrameControls from './FrameControls';
import { BackIcon } from './Icons';

interface VideoWorkspaceProps {
  video: Video;
  onBack: () => void;
  getAnnotations: () => Promise<Annotation[]>;
  addAnnotation: (annotation: NewAnnotation) => Promise<Annotation>;
  addMultipleAnnotations: (annotations: NewAnnotation[]) => Promise<void>;
  updateAnnotation: (annotation: Annotation) => Promise<void>;
  deleteAnnotation: (annotationId: string) => Promise<void>;
}

const VideoWorkspace: React.FC<VideoWorkspaceProps> = ({
  video,
  onBack,
  getAnnotations,
  addAnnotation,
  addMultipleAnnotations,
  updateAnnotation,
  deleteAnnotation
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const videoUrl = useMemo(() => URL.createObjectURL(video.file), [video.file]);
  const videoPlayerRef = useRef<VideoPlayerHandles>(null);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleSeek = (time: number) => {
    videoPlayerRef.current?.seek(time);
  };

  const handleSeekBy = (amount: number) => {
    videoPlayerRef.current?.seekBy(amount);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg h-full flex flex-col w-full border border-gray-700">
      <div className="flex items-center p-3 border-b border-gray-700 bg-gray-800/80 rounded-t-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mr-3 px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          title="Back to list"
        >
          <BackIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <h2 className="text-md font-semibold truncate" title={video.name}>{video.name}</h2>
      </div>

      <div className="flex flex-col lg:flex-row flex-grow p-4 gap-4 overflow-hidden">
        <div className="lg:w-2/3 flex flex-col">
          <VideoPlayer
            ref={videoPlayerRef}
            src={videoUrl}
            onTimeUpdate={setCurrentTime}
          />
          <FrameControls onSeekBy={handleSeekBy} />
        </div>
        <div className="lg:w-1/3 flex flex-col h-full overflow-hidden">
          <AnnotationManager
            video={video}
            currentTime={currentTime}
            getAnnotations={getAnnotations}
            addAnnotation={addAnnotation}
            addMultipleAnnotations={addMultipleAnnotations}
            updateAnnotation={updateAnnotation}
            deleteAnnotation={deleteAnnotation}
            onSeek={handleSeek}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoWorkspace;