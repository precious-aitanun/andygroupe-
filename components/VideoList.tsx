/// <reference lib="dom" />

import React, { useRef } from 'react';
import { Video } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface VideoListProps {
  videos: Video[];
  selectedVideoId?: string;
  onSelectVideo: (video: Video) => void;
  onAddVideo: (file: File) => void;
  onDeleteVideo: (videoId: string) => void;
}

const VideoList: React.FC<VideoListProps> = ({ videos, selectedVideoId, onSelectVideo, onAddVideo, onDeleteVideo }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onAddVideo(event.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg h-full flex flex-col p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Video Library</h2>
        <button
          onClick={triggerFileInput}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-full transition-colors duration-200 flex items-center justify-center"
          title="Upload new video"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
        <input
          type="file"
          accept="video/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {videos.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <p>No videos uploaded yet.</p>
            <p className="text-sm">Click the '+' button to add one.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {videos.map(video => (
              <li
                key={video.id}
                className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-all duration-200 ${
                  selectedVideoId === video.id ? 'bg-blue-600 shadow-md' : 'bg-gray-700 hover:bg-gray-600/50'
                }`}
              >
                <div className="flex-grow truncate" onClick={() => onSelectVideo(video)}>
                  <span className="font-medium text-sm">{video.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete "${video.name}" and all its annotations?`)) {
                      onDeleteVideo(video.id);
                    }
                  }}
                  className="ml-3 p-1.5 rounded-full text-gray-400 hover:bg-red-500 hover:text-white transition-colors duration-200 flex-shrink-0"
                  title="Delete video"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VideoList;