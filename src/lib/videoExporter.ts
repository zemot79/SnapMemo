export interface ExportOptions {
  format: string;
  quality: string;
  fps: number;
}

export const exportCanvasAsVideo = async (
  canvas: HTMLCanvasElement,
  options: ExportOptions
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Get canvas stream
      const stream = canvas.captureStream(options.fps);
      
      // Determine MIME type based on format
      let mimeType = 'video/webm;codecs=vp9';
      let extension = 'webm';
      
      if (options.format === 'mp4') {
        // Most browsers support webm, so we'll use that and name it mp4
        mimeType = 'video/webm;codecs=h264';
        extension = 'webm'; // Browser exports as webm
      } else if (options.format === 'webm') {
        mimeType = 'video/webm;codecs=vp9';
        extension = 'webm';
      }
      
      // Check if MediaRecorder is supported with this mimeType
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Fallback to basic webm
        mimeType = 'video/webm';
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: getBitrate(options.quality),
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `video_export_${Date.now()}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 100);
        resolve();
      };
      
      mediaRecorder.onerror = (error) => {
        reject(error);
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      
      // Stop recording after a short duration (this is just for demo)
      // In production, this should be based on the actual video duration
      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
      }, 5000); // Record for 5 seconds as demo
      
    } catch (error) {
      reject(error);
    }
  });
};

const getBitrate = (quality: string): number => {
  switch (quality) {
    case 'low':
      return 2500000; // 2.5 Mbps for 720p
    case 'medium':
      return 5000000; // 5 Mbps for 1080p
    case 'high':
      return 10000000; // 10 Mbps for 1440p
    case 'ultra':
      return 20000000; // 20 Mbps for 4K
    default:
      return 5000000;
  }
};
