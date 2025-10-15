import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { formatTimestamp } from '../utils/time';
import { PlayIcon, PauseIcon } from './Icons';

interface VideoPlayerProps {
  src: string;
  onTimeUpdate: (time: number) => void;
}

export interface VideoPlayerHandles {
  seek: (time: number) => void;
}

const ControlButton: React.FC<{onClick: () => void, children: React.ReactNode, title: string, className?: string}> = ({ onClick, children, title, className = '' }) => (
    <button onClick={onClick} title={title} className={`px-2 py-1.5 text-xs font-semibold text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 rounded-md transition-colors ${className}`}>
        {children}
    </button>
);

const VideoPlayer = forwardRef<VideoPlayerHandles, VideoPlayerProps>(({ src, onTimeUpdate }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useImperativeHandle(ref, () => ({
    seek: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    }
  }));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate(video.currentTime);
    };
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onTimeUpdate]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play();
    }
  };

  const adjustTime = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + amount));
    }
  };
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if(progressRef.current && videoRef.current) {
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const clickedTime = (x / width) * duration;
        videoRef.current.currentTime = clickedTime;
    }
  };

  const playbackRates = [0.25, 0.5, 1, 1.5, 2];

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden shadow-2xl flex flex-col">
      <video ref={videoRef} src={src} className="w-full aspect-video" onClick={togglePlay} />
      
      <div className="bg-gray-800/80 p-3 space-y-3">
        <div ref={progressRef} onClick={handleProgressClick} className="w-full h-2 bg-gray-600 rounded-full cursor-pointer group">
          <div className="h-full bg-blue-500 rounded-full group-hover:bg-blue-400 transition-colors" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
        </div>

        <div className="flex items-center justify-between text-gray-300">
           <div className="text-xs font-mono text-left">{formatTimestamp(currentTime)}</div>
            <div className="flex items-center gap-1.5">
                <ControlButton onClick={() => adjustTime(-10)} title="-10s">-10s</ControlButton>
                <ControlButton onClick={() => adjustTime(-1)} title="-1s">-1s</ControlButton>
                <ControlButton onClick={() => adjustTime(-0.1)} title="-1 frame">-1f</ControlButton>
                
                <button onClick={togglePlay} className="p-2 mx-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors" title={isPlaying ? "Pause" : "Play"}>
                    {isPlaying ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}
                </button>
                
                <ControlButton onClick={() => adjustTime(0.1)} title="+1 frame">+1f</ControlButton>
                <ControlButton onClick={() => adjustTime(1)} title="+1s">+1s</ControlButton>
                <ControlButton onClick={() => adjustTime(10)} title="+10s">+10s</ControlButton>
            </div>
           <div className="flex items-center justify-end gap-3">
                <div className="relative">
                    <select
                        value={playbackRate}
                        onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                        className="bg-gray-700/50 text-gray-200 text-xs rounded-md border-none focus:ring-2 focus:ring-blue-500 focus:outline-none py-1 pl-2 pr-7 appearance-none cursor-pointer"
                        title="Playback Speed"
                    >
                        {playbackRates.map(rate => (
                            <option key={rate} value={rate}>{rate}x</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
                <div className="text-xs font-mono text-right">{formatTimestamp(duration)}</div>
           </div>
        </div>
      </div>
    </div>
  );
});

export default VideoPlayer;