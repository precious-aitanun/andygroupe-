
export interface Video {
  id: string;
  name: string;
  file: File;
}

export interface Annotation {
  id: string;
  videoId: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

export type NewAnnotation = Omit<Annotation, 'id'>;