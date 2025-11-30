// src/lib/ffmpegPreview.ts
// FFmpeg-alapú előnézet generálás (thumbnail + H.264 preview)

let previewFfmpeg: any = null;
let previewFetchFile: any = null;
let previewFfmpegLoading: Promise<void> | null = null;

function loadScriptOnce(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("FFmpeg script load error")),
        { once: true }
      );
      if (existing.readyState === "complete") {
        resolve();
      }
      return;
    }

    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("FFmpeg script load error"));
    document.head.appendChild(s);
  });
}

async function ensurePreviewFFmpeg() {
  if (previewFfmpeg) return { ffmpeg: previewFfmpeg, fetchFile: previewFetchFile };

  if (!previewFfmpegLoading) {
    previewFfmpegLoading = (async () => {
      await loadScriptOnce(
        "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.8/dist/ffmpeg.min.js"
      );

      const FFmpeg = (window as any).FFmpeg;
      if (!FFmpeg) {
        throw new Error("FFmpeg global not found for preview");
      }

      const ffmpeg = FFmpeg.createFFmpeg({
        log: false,
        corePath:
          "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.2/dist/ffmpeg-core.js",
      });

      await ffmpeg.load();

      previewFfmpeg = ffmpeg;
      previewFetchFile = FFmpeg.fetchFile;
    })();
  }

  await previewFfmpegLoading;
  return { ffmpeg: previewFfmpeg, fetchFile: previewFetchFile };
}

/**
 * Bármilyen bemeneti videóból:
 *  - 1 thumbnail PNG
 *  - 1 rövid H.264 preview MP4
 */
export async function generatePreviewForFile(file: File): Promise<{
  previewUrl: string;
  thumbnailUrl: string;
}> {
  const { ffmpeg, fetchFile } = await ensurePreviewFFmpeg();

  const id = Math.random().toString(36).slice(2);
  const inputName = `input_${id}.mp4`;
  const thumbName = `thumb_${id}.png`;
  const previewName = `preview_${id}.mp4`;

  ffmpeg.FS("writeFile", inputName, await fetchFile(file));

  // 1) Thumbnail – első frame 640px szélesre skálázva
  await ffmpeg.run(
    "-i",
    inputName,
    "-ss",
    "0",
    "-frames:v",
    "1",
    "-vf",
    "scale=640:-1",
    thumbName
  );

  // 2) Rövid H.264 preview (3s, 640px)
  await ffmpeg.run(
    "-i",
    inputName,
    "-t",
    "3",
    "-vf",
    "scale=640:-1",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "28",
    previewName
  );

  const thumbData = ffmpeg.FS("readFile", thumbName);
  const previewData = ffmpeg.FS("readFile", previewName);

  // Takarítás
  ffmpeg.FS("unlink", inputName);
  ffmpeg.FS("unlink", thumbName);
  ffmpeg.FS("unlink", previewName);

  const thumbBlob = new Blob([thumbData.buffer], { type: "image/png" });
  const previewBlob = new Blob([previewData.buffer], { type: "video/mp4" });

  return {
    thumbnailUrl: URL.createObjectURL(thumbBlob),
    previewUrl: URL.createObjectURL(previewBlob),
  };
}
