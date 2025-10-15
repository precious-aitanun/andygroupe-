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
    updateAnnotation,
    deleteAnnotation,
    isDBReady 
  } = useIndexedDB();
  
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

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
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <LogoIcon className="w-16 h-16 animate-pulse text-blue-500" />
          <p className="text-lg">Initializing Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon className="w-8 h-8 text-blue-500" />
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
            />
          </div>
          <div className={`
            ${!selectedVideo ? 'hidden md:flex' : 'block'} 
            md:w-2/3 lg:w-3/4 transition-all duration-300
          `}>
            {selectedVideo ? (
              <VideoWorkspace
                video={selectedVideo}
                onBack={handleDeselectVideo}
                getAnnotations={() => getAnnotationsForVideo(selectedVideo.id)}
                addAnnotation={(annotation) => addAnnotation({ ...annotation, videoId: selectedVideo.id })}
                updateAnnotation={updateAnnotation}
                deleteAnnotation={deleteAnnotation}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-gray-800 rounded-lg p-8 border border-gray-700">
                <p className="text-xl text-gray-400">Select a video to begin annotating</p>
                <p className="text-gray-500 mt-2">Or upload a new video from the list panel.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;