
import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { 
    PlayIcon, 
    PauseIcon,
    BackIcon,
    ChevronRightIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    StepBackwardIcon,
    StepForwardIcon
} from './Icons';
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
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);

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
    }
  };
  
  const seekBy = (amount: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + amount));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      onTimeUpdate(newTime);
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
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-2 px-4 pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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

          <div className="flex items-center gap-x-1 sm:gap-x-2">
            <button onClick={() => seekBy(-10)} className="p-1.5 rounded-full hover:bg-white/20 transition-colors" title="-10s"><ChevronDoubleLeftIcon className="w-5 h-5" /></button>
            <button onClick={() => seekBy(-1)} className="p-1.5 rounded-full hover:bg-white/20 transition-colors" title="-1s"><BackIcon className="w-5 h-5" /></button>
            <button onClick={() => seekBy(-0.1)} className="p-1.5 rounded-full hover:bg-white/20 transition-colors" title="-0.1s (100ms)"><StepBackwardIcon className="w-5 h-5" /></button>
            <button onClick={() => seekBy(0.1)} className="p-1.5 rounded-full hover:bg-white/20 transition-colors" title="+0.1s (100ms)"><StepForwardIcon className="w-5 h-5" /></button>
            <button onClick={() => seekBy(1)} className="p-1.5 rounded-full hover:bg-white/20 transition-colors" title="+1s"><ChevronRightIcon className="w-5 h-5" /></button>
            <button onClick={() => seekBy(10)} className="p-1.5 rounded-full hover:bg-white/20 transition-colors" title="+10s"><ChevronDoubleRightIcon className="w-5 h-5" /></button>
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
