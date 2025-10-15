/// <reference lib="dom" />

import { Annotation } from '../types';
import { formatTimestamp } from './time';

export const exportAnnotationsToTXT = (annotations: Annotation[], videoName: string) => {
  if (annotations.length === 0) {
    alert("No annotations to export.");
    return;
  }

  const txtContent = annotations.map((ann, index) => {
    return `Annotation ${index + 1}:\n` +
           `Time: ${formatTimestamp(ann.startTime)} --> ${formatTimestamp(ann.endTime)}\n` +
           `Text: ${ann.text}\n`;
  }).join('\n---\n\n');

  const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  const safeFileName = videoName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.setAttribute('download', `${safeFileName}_annotations.txt`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};