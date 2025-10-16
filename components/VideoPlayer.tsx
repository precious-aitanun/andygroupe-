/// <reference lib="dom" />

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { 
    PlayIcon, 
    PauseIcon,
} from './Icons';
import { formatTimestamp } from '../utils/time';

interface VideoPlayerProps {
  src: string;
  onTimeUpdate: (time: number) => void;
}

export interface VideoPlayerHandles {
  seek: (time: number) => void;
  seekBy: (amount: number) => void;
}

const VideoPlayer = forwardRef<VideoPlayerHandles, VideoPlayerProps>(({ src, onTimeUpdate }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    seek(time: number) {
      if (videoRef.current) {
        const roundedTime = Math.round(time * 1000) / 1000;
        videoRef.current.currentTime = roundedTime;
        setCurrentTime(roundedTime);
        onTimeUpdate(roundedTime);
      }
    },
    seekBy(amount: number) {
        if (videoRef.current) {
            const currentDuration = videoRef.current.duration;
            const newTime = videoRef.current.currentTime + amount;
            const clampedTime = Math.max(0, Math.min(currentDuration, newTime));
            // Round to 3 decimal places to avoid floating point inaccuracies
            const roundedTime = Math.round(clampedTime * 1000) / 1000;
            
            videoRef.current.currentTime = roundedTime;
            setCurrentTime(roundedTime);
            onTimeUpdate(roundedTime);
        }
    }
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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target as Node)) {
        setIsSpeedMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      onTimeUpdate(time);
    }
  };

  return (
    <div className="bg-black rounded-t-lg overflow-hidden w-full">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-auto aspect-video"
      />
      <div className="pt-2 px-4 pb-3">
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={currentTime}
          onChange={handleProgressChange}
          className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-2"
        />
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="p-1" aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7" />}
            </button>
            <span className="text-xs font-mono w-28 text-left">{formatTimestamp(currentTime)} / {formatTimestamp(duration)}</span>
          </div>
          
          <div className="relative flex justify-end w-28">
            <button
              onClick={() => setIsSpeedMenuOpen(prev => !prev)}
              className="text-xs font-semibold w-16 text-center p-1.5 rounded-md hover:bg-white/20 transition-colors"
              aria-haspopup="true"
              aria-expanded={isSpeedMenuOpen}
            >
              {playbackRate}x
            </button>
            {isSpeedMenuOpen && (
              <div ref={speedMenuRef} className="absolute bottom-full right-0 mb-2 w-24 bg-gray-900/90 backdrop-blur-sm rounded-md shadow-lg z-10 py-1 border border-gray-700">
                {[2, 1.5, 1.25, 1, 0.75, 0.5, 0.25].map(speed => (
                  <button
                    key={speed}
                    onClick={() => { setPlaybackRate(speed); setIsSpeedMenuOpen(false); }}
                    className={`block w-full text-center px-3 py-1.5 text-sm hover:bg-blue-600 transition-colors ${playbackRate === speed ? 'bg-blue-600 text-white font-bold' : 'text-gray-200'}`}
                  >
                    {speed === 1 ? 'Normal' : `${speed}x`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;