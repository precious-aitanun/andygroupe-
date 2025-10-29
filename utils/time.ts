
export const formatTimestamp = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00.000';
  }
  
  const totalMilliseconds = Math.round(seconds * 1000);
  
  const ms = totalMilliseconds % 1000;
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60);

  const paddedMinutes = String(m).padStart(2, '0');
  const paddedSeconds = String(s).padStart(2, '0');
  const paddedMilliseconds = String(ms).padStart(3, '0');
  
  return `${paddedMinutes}:${paddedSeconds}.${paddedMilliseconds}`;
};