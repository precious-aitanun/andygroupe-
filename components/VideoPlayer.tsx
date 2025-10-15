import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { PlayIcon, PauseIcon } from './Icons';
import { formatTimestamp } from '../utils/time';

interface VideoPlayerProps {
  src: string;
  onTimeUpdate: (time: number) => void;
}

export interface VideoPlayerHandles {
  seek: (time: number) => void;
}

const VideoPlayer = forwardRef<VideoPlayerHandles, VideoPlayerProps>(({ src, onTimeUpdate }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useImperativeHandle(ref, () => ({
    seek(time: number) {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
  }));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video) return;
      setCurrentTime(video.currentTime);
      onTimeUpdate(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (!video) return;
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', () => setIsPlaying(true));
      video.removeEventListener('pause', () => setIsPlaying(false));
    };
  }, [onTimeUpdate]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden group w-full">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-auto aspect-video"
        onClick={togglePlay}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-4 text-white">
          <button onClick={togglePlay} className="p-1">
            {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
          </button>
          <span className="text-xs font-mono">{formatTimestamp(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.01"
            value={currentTime}
            onChange={handleProgressChange}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs font-mono">{formatTimestamp(duration)}</span>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
