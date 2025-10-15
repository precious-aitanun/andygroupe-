import { useState, useEffect, useCallback } from 'react';
import { openDB, IDBPDatabase } from 'idb';
import { Video, Annotation, NewAnnotation } from '../types';

const DB_NAME = 'VideoAnnotationDB';
const DB_VERSION = 1;
const VIDEO_STORE = 'videos';
const ANNOTATION_STORE = 'annotations';

let dbPromise: Promise<IDBPDatabase> | null = null;

const initDB = () => {
  if (dbPromise) return dbPromise;
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(VIDEO_STORE)) {
        db.createObjectStore(VIDEO_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ANNOTATION_STORE)) {
        const store = db.createObjectStore(ANNOTATION_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('videoId', 'videoId', { unique: false });
      }
    },
  });
  return dbPromise;
};

const useIndexedDB = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isDBReady, setIsDBReady] = useState(false);

  const getVideos = useCallback(async () => {
    const db = await initDB();
    const allVideos = await db.getAll(VIDEO_STORE);
    setVideos(allVideos);
  }, []);

  useEffect(() => {
    initDB().then(() => {
        setIsDBReady(true);
        getVideos();
    });
  }, [getVideos]);

  const addVideo = async (file: File) => {
    const newVideo: Video = {
      id: self.crypto.randomUUID(),
      name: file.name,
      file: file,
    };
    const db = await initDB();
    await db.add(VIDEO_STORE, newVideo);
    getVideos();
  };

  const deleteVideo = async (videoId: string) => {
    const db = await initDB();
    await db.delete(VIDEO_STORE, videoId);
    // Also delete associated annotations
    const tx = db.transaction(ANNOTATION_STORE, 'readwrite');
    const index = tx.store.index('videoId');
    let cursor = await index.openCursor(videoId);
    while (cursor) {
      cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
    getVideos();
  };

  const getAnnotationsForVideo = async (videoId: string): Promise<Annotation[]> => {
    const db = await initDB();
    return db.getAllFromIndex(ANNOTATION_STORE, 'videoId', videoId);
  };

  const addAnnotation = async (annotation: NewAnnotation): Promise<Annotation> => {
    const db = await initDB();
    const newId = self.crypto.randomUUID();
    const fullAnnotation = { ...annotation, id: newId };
    await db.add(ANNOTATION_STORE, fullAnnotation);
    return fullAnnotation;
  };

  const updateAnnotation = async (annotation: Annotation) => {
    const db = await initDB();
    await db.put(ANNOTATION_STORE, annotation);
  };

  const deleteAnnotation = async (annotationId: string) => {
    const db = await initDB();
    await db.delete(ANNOTATION_STORE, annotationId);
  };

  return { 
    videos, 
    addVideo, 
    deleteVideo, 
    getAnnotationsForVideo, 
    addAnnotation, 
    updateAnnotation, 
    deleteAnnotation,
    isDBReady 
  };
};

export default useIndexedDB;