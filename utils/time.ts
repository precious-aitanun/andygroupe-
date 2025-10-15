
export const formatTimestamp = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00.000';
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(Math.floor(remainingSeconds)).padStart(2, '0');
  const milliseconds = String(Math.round((remainingSeconds - Math.floor(remainingSeconds)) * 1000)).padStart(3, '0');
  
  return `${paddedMinutes}:${paddedSeconds}.${milliseconds}`;
};
