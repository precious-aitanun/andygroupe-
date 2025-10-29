import React from 'react';
import {
  ChevronDoubleLeftIcon,
  BackIcon,
  StepBackwardIcon,
  StepForwardIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
} from './Icons';

interface FrameControlsProps {
  onSeekBy: (amount: number) => void;
  onSeek: (time: number) => void;
  currentTime: number;
  frameRate: number;
}

const ControlButton: React.FC<{
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, title, children, className = '' }) => (
  <button
    onClick={onClick}
    title={title}
    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-sm font-semibold ${className}`}
  >
    {children}
  </button>
);

const FrameControls: React.FC<FrameControlsProps> = ({ onSeekBy, onSeek, currentTime, frameRate }) => {

  const handleFrameSeek = (direction: 1 | -1) => {
    if (frameRate <= 0) return; // Avoid division by zero
    
    // Calculate the current frame number by multiplying by frameRate, which is more direct than dividing by frameDuration.
    const currentFrame = Math.round(currentTime * frameRate);
    const nextFrame = currentFrame + direction;

    let newTime: number;

    // For 30fps, we use a special calculation to match the desired rounding behavior.
    // By calculating the total milliseconds from the frame number and using Math.floor,
    // we ensure that 2/30s becomes 66ms (0.066s) instead of rounding up to 67ms.
    if (frameRate === 30) {
      const totalMs = Math.floor((nextFrame * 1000) / frameRate);
      newTime = totalMs / 1000;
    } else {
      // For other frame rates (like 10fps), the standard calculation is accurate.
      newTime = nextFrame / frameRate;
    }
    
    // Ensure the new time is not negative.
    onSeek(newTime < 0 ? 0 : newTime);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2 bg-gray-800 rounded-b-lg border-x border-b border-gray-700">
      <div className="flex items-stretch gap-2">
        <ControlButton onClick={() => onSeekBy(-10)} title="-10 seconds">
          <ChevronDoubleLeftIcon className="w-5 h-5" />
          <span className="hidden lg:inline">-10s</span>
        </ControlButton>
        <ControlButton onClick={() => onSeekBy(-1)} title="-1 second">
          <BackIcon className="w-5 h-5" />
          <span className="hidden lg:inline">-1s</span>
        </ControlButton>
        <ControlButton onClick={() => handleFrameSeek(-1)} title={`-1 frame (1/${frameRate}s)`}>
          <StepBackwardIcon className="w-5 h-5" />
          <span>-1f</span>
        </ControlButton>
      </div>

      <div className="flex items-stretch gap-2">
        <ControlButton onClick={() => handleFrameSeek(1)} title={`+1 frame (1/${frameRate}s)`}>
          <span>+1f</span>
          <StepForwardIcon className="w-5 h-5" />
        </ControlButton>
        <ControlButton onClick={() => onSeekBy(1)} title="+1 second">
          <span className="hidden lg:inline">+1s</span>
          <ChevronRightIcon className="w-5 h-5" />
        </ControlButton>
        <ControlButton onClick={() => onSeekBy(10)} title="+10 seconds">
          <span className="hidden lg:inline">+10s</span>
          <ChevronDoubleRightIcon className="w-5 h-5" />
        </ControlButton>
      </div>
    </div>
  );
};

export default FrameControls;