import React from 'react';
import {
  ChevronDoubleLeftIcon,
  BackIcon,
  StepBackwardIcon,
  StepForwardIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
} from './Icons';

const SMALL_STEP_DURATION = 0.1; // 100ms step

interface FrameControlsProps {
  onSeekBy: (amount: number) => void;
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

const FrameControls: React.FC<FrameControlsProps> = ({ onSeekBy }) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2 bg-gray-800 rounded-b-lg border-x border-b border-gray-700">
      <div className="flex items-stretch gap-2">
        <ControlButton onClick={() => onSeekBy(-10)} title="-10 seconds">
          <ChevronDoubleLeftIcon className="w-5 h-5" />
          <span>-10s</span>
        </ControlButton>
        <ControlButton onClick={() => onSeekBy(-1)} title="-1 second">
          <BackIcon className="w-5 h-5" />
          <span>-1s</span>
        </ControlButton>
        <ControlButton onClick={() => onSeekBy(-SMALL_STEP_DURATION)} title="-0.1 seconds">
          <StepBackwardIcon className="w-5 h-5" />
          <span>-0.1s</span>
        </ControlButton>
      </div>

      <div className="flex items-stretch gap-2">
        <ControlButton onClick={() => onSeekBy(SMALL_STEP_DURATION)} title="+0.1 seconds">
          <span>+0.1s</span>
          <StepForwardIcon className="w-5 h-5" />
        </ControlButton>
        <ControlButton onClick={() => onSeekBy(1)} title="+1 second">
          <span>+1s</span>
          <ChevronRightIcon className="w-5 h-5" />
        </ControlButton>
        <ControlButton onClick={() => onSeekBy(10)} title="+10 seconds">
          <span>+10s</span>
          <ChevronDoubleRightIcon className="w-5 h-5" />
        </ControlButton>
      </div>
    </div>
  );
};

export default FrameControls;
