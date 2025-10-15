/// <reference lib="dom" />

import { Annotation } from '../types';
import { formatTimestamp } from './time';

export const exportAnnotationsToCSV = (annotations: Annotation[], videoName: string) => {
  if (annotations.length === 0) {
    alert("No annotations to export.");
    return;
  }

  const headers = ['start_time_seconds', 'start_time_formatted', 'end_time_seconds', 'end_time_formatted', 'annotation_text'];
  const rows = annotations.map(ann => [
    ann.startTime.toFixed(3),
    formatTimestamp(ann.startTime),
    ann.endTime.toFixed(3),
    formatTimestamp(ann.endTime),
    `"${ann.text.replace(/"/g, '""')}"` // Escape double quotes
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  const safeFileName = videoName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.setAttribute('download', `${safeFileName}_annotations.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};