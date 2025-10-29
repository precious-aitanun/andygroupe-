import React, { useState, useEffect, useCallback } from 'react';
import { Video, Annotation } from './types';
import VideoList from './components/VideoList';
import VideoWorkspace from './components/VideoWorkspace';
import useIndexedDB from './hooks/useIndexedDB';
import { LogoIcon } from './components/Icons';

const App: React.FC = () => {
  const { 
    videos, 
    addVideo, 
    deleteVideo, 
    getAnnotationsForVideo,
    addAnnotation,
    addMultipleAnnotations,
    updateAnnotation,
    deleteAnnotation,
    isDBReady 
  } = useIndexedDB();
  
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [frameRate, setFrameRate] = useState<number>(30); // Default to 30 FPS

  const handleSelectVideo = useCallback((video: Video) => {
    setSelectedVideo(video);
  }, []);

  const handleDeselectVideo = () => {
    setSelectedVideo(null);
  };
  
  const handleDeleteVideo = async (videoId: string) => {
    if (selectedVideo?.id === videoId) {
      setSelectedVideo(null);
    }
    await deleteVideo(videoId);
  };

  if (!isDBReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <LogoIcon className="w-16 h-16 animate-pulse text-sky-500" />
          <p className="text-lg">Initializing Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon className="w-8 h-8 text-sky-500" />
            <h1 className="text-xl font-bold tracking-tight">Video Annotation Pro</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-6 h-full">
          <div className={`
            ${selectedVideo ? 'hidden md:block' : 'block'} 
            md:w-1/3 lg:w-1/4 transition-all duration-300
          `}>
            <VideoList
              videos={videos}
              onSelectVideo={handleSelectVideo}
              onAddVideo={addVideo}
              onDeleteVideo={handleDeleteVideo}
              selectedVideoId={selectedVideo?.id}
              frameRate={frameRate}
              onFrameRateChange={setFrameRate}
            />
          </div>
          <div className={`
            ${!selectedVideo ? 'hidden md:flex' : 'block'} 
            md:w-2/3 lg:w-3/4 transition-all duration-300
          `}>
            {selectedVideo ? (
              <VideoWorkspace
                video={selectedVideo}
                frameRate={frameRate}
                onBack={handleDeselectVideo}
                getAnnotations={() => getAnnotationsForVideo(selectedVideo.id)}
                addAnnotation={(annotation) => addAnnotation({ ...annotation, videoId: selectedVideo.id })}
                addMultipleAnnotations={addMultipleAnnotations}
                updateAnnotation={updateAnnotation}
                deleteAnnotation={deleteAnnotation}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-slate-800 rounded-xl p-8 border border-slate-700">
                <p className="text-xl text-slate-400">Select a video to begin annotating</p>
                <p className="text-slate-500 mt-2">Or upload a new video from the list panel.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;