/// <reference lib="dom" />

import { Annotation, NewAnnotation } from '../types';
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

export const importAnnotationsFromCSV = (file: File): Promise<Omit<NewAnnotation, 'videoId'>[]> => {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const csv = event.target?.result as string;
              if (!csv) {
                return reject(new Error("File is empty."));
              }

              const lines = csv.split(/\r\n|\n/);
              if (lines.length < 2) {
                  return reject(new Error("CSV file is empty or has no data rows."));
              }

              const header = lines[0].trim().split(',');
              const expectedHeaders = ['start_time_seconds', 'start_time_formatted', 'end_time_seconds', 'end_time_formatted', 'annotation_text'];
              
              if (header.length !== expectedHeaders.length || !header.every((value, index) => value === expectedHeaders[index])) {
                  return reject(new Error("Invalid CSV header format. Expected: " + expectedHeaders.join(',')));
              }

              const annotations: Omit<NewAnnotation, 'videoId'>[] = [];
              for (let i = 1; i < lines.length; i++) {
                  const line = lines[i].trim();
                  if (!line) continue;

                  const parts = line.split(',');
                  if (parts.length < 5) continue;

                  const startTime = parseFloat(parts[0]);
                  const endTime = parseFloat(parts[2]);
                  const textWithQuotes = parts.slice(4).join(',');
                  
                  if (isNaN(startTime) || isNaN(endTime)) continue;

                  let text = textWithQuotes.startsWith('"') && textWithQuotes.endsWith('"')
                      ? textWithQuotes.substring(1, textWithQuotes.length - 1)
                      : textWithQuotes;
                  text = text.replace(/""/g, '"');

                  annotations.push({ startTime, endTime, text });
              }
              resolve(annotations);
          } catch (error) {
              reject(error);
          }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
  });
};
