import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

const loadFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpeg && ffmpeg.loaded) {
    return ffmpeg;
  }
  ffmpeg = new FFmpeg();
  ffmpeg.on('log', ({ message }) => {
    console.log(message); // For debugging
  });
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  return ffmpeg;
};

export const spliceVideo = async (
  videoFile: File,
  startTime: number,
  endTime: number,
  onProgress: (progress: number) => void
): Promise<Blob> => {
  const ffmpegInstance = await loadFFmpeg();

  // Detach old listeners to avoid multiple progress updates on the same instance
  ffmpegInstance.off('progress');
  ffmpegInstance.on('progress', ({ progress }) => {
    // progress can sometimes be > 1, so we clamp it to 100
    onProgress(Math.min(100, Math.round(progress * 100)));
  });

  const uniqueId = self.crypto.randomUUID();
  const inputFileName = `input-${uniqueId}`;
  const outputFileName = `output-${uniqueId}.mp4`;

  await ffmpegInstance.writeFile(inputFileName, await fetchFile(videoFile));

  const duration = endTime - startTime;

  // Using re-encoding for frame accuracy. This is slower but more precise than stream copying.
  await ffmpegInstance.exec([
    '-i',
    inputFileName,
    '-ss',
    startTime.toFixed(3),
    '-t',
    duration.toFixed(3),
    outputFileName,
  ]);

  const data = await ffmpegInstance.readFile(outputFileName);

  // Clean up virtual file system
  await ffmpegInstance.deleteFile(inputFileName);
  await ffmpegInstance.deleteFile(outputFileName);

  return new Blob([data], { type: 'video/mp4' });
};
