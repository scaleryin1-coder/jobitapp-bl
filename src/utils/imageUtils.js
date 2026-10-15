/**
 * Image processing & compression utility for JOBit
 * Compresses images before storing in Firestore / Supabase / localStorage to guarantee
 * payload fits well within the 1MB Firestore document limit and 5MB localStorage quota.
 */

export async function compressImage(fileOrDataUrl, maxWidth = 800, maxHeight = 800, quality = 0.75) {
  if (!fileOrDataUrl) return '';

  return new Promise((resolve, reject) => {
    // If it's already an external HTTP(S) URL, keep as-is
    if (typeof fileOrDataUrl === 'string' && (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://'))) {
      return resolve(fileOrDataUrl);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleLoad = () => {
      try {
        let width = img.width || 800;
        let height = img.height || 800;

        // Downscale while preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (err) {
        console.warn('Image compression canvas fallback:', err);
        if (typeof fileOrDataUrl === 'string') {
          resolve(fileOrDataUrl);
        } else {
          reject(err);
        }
      }
    };

    img.onload = handleLoad;
    img.onerror = (err) => {
      console.warn('Image loading error for compression:', err);
      if (typeof fileOrDataUrl === 'string') {
        resolve(fileOrDataUrl);
      } else {
        reject(new Error('Failed to load image file for processing.'));
      }
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result;
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      resolve('');
    }
  });
}
