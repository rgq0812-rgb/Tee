
/**
 * Resizes an image to a maximum dimension while maintaining aspect ratio.
 * This helps prevent "Insufficient Memory" errors and reduces bandwidth.
 */
export async function resizeImage(base64: string, maxDimension: number = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = `data:image/jpeg;base64,${base64}`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // Use lower quality to further save memory
      const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      resolve(resizedBase64);
    };
    img.onerror = (e) => reject(e);
  });
}

/**
 * Extracts a frame from a video blob and resizes it.
 */
export async function extractResizedFrameFromVideo(blob: Blob, maxDimension: number = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(blob);
    video.crossOrigin = "anonymous";
    
    video.onloadeddata = () => {
      video.currentTime = 0.5; // Grab frame at 0.5s
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > height) {
        if (width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(video, 0, 0, width, height);
      const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      URL.revokeObjectURL(video.src);
      resolve(resizedBase64);
    };
    
    video.onerror = (e) => reject(e);
  });
}
