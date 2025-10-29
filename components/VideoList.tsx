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
  frameRate: number;
  onFrameRateChange: (rate: number) => void;
}

const VideoList: React.FC<VideoListProps> = ({ videos, selectedVideoId, onSelectVideo, onAddVideo, onDeleteVideo, frameRate, onFrameRateChange }) => {
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
    <div className="bg-slate-800 rounded-xl shadow-lg h-full flex flex-col p-4 border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Video Library</h2>
        <button
          onClick={triggerFileInput}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold p-2 rounded-full transition-colors duration-200 flex items-center justify-center"
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
      <div className="mb-4">
        <label htmlFor="frame-rate-select" className="block text-sm font-medium text-slate-400 mb-1">
          Annotation Mode
        </label>
        <select
          id="frame-rate-select"
          value={frameRate}
          onChange={(e) => onFrameRateChange(Number(e.target.value))}
          className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-sky-500 focus:border-sky-500"
        >
          <option value={30}>30 FPS (0.033s step)</option>
          <option value={10}>10 FPS (0.100s step)</option>
        </select>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {videos.length === 0 ? (
          <div className="text-center text-slate-400 py-10">
            <p>No videos uploaded yet.</p>
            <p className="text-sm">Click the '+' button to add one.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {videos.map(video => (
              <li
                key={video.id}
                className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-all duration-200 border-l-4 ${
                  selectedVideoId === video.id ? 'bg-sky-600 shadow-md border-sky-400' : 'bg-slate-700 hover:bg-slate-600/50 border-transparent hover:border-slate-500'
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
                  className="ml-3 p-1.5 rounded-full text-slate-400 hover:bg-red-500 hover:text-white transition-colors duration-200 flex-shrink-0"
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