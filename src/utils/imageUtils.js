/**
 * Image processing & compression utility for JOBit
 * Compresses images before storing in Firestore / Supabase / localStorage to guarantee
 * payload fits well within the 1MB Firestore document limit and 5MB localStorage quota.
 */

export async function compressImage(fileOrDataUrl, maxWidth = 800, maxHeight = 800, quality = 0.75) {
  if (!fileOrDataUrl) return '';

  // If already an external HTTP(S) URL, keep as-is
  if (typeof fileOrDataUrl === 'string' && (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://'))) {
    return fileOrDataUrl;
  }

  return new Promise((resolve) => {
    let isSettled = false;
    const safeResolve = (res) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(safetyTimer);
        resolve(res || '');
      }
    };

    // Safety timeout: never hang or spin more than 1500ms
    const safetyTimer = setTimeout(() => {
      if (typeof fileOrDataUrl === 'string') {
        safeResolve(fileOrDataUrl);
      } else {
        try {
          const reader = new FileReader();
          reader.onload = (e) => safeResolve(e.target?.result || '');
          reader.onerror = () => safeResolve('');
          reader.readAsDataURL(fileOrDataUrl);
        } catch {
          safeResolve('');
        }
      }
    }, 1500);

    const processSrc = (srcStr) => {
      if (!srcStr || typeof srcStr !== 'string') {
        return safeResolve('');
      }

      const img = new Image();
      // DO NOT set crossOrigin for data: URLs or blobs as it causes browser security errors
      if (srcStr.startsWith('http://') || srcStr.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width || 800;
          let height = img.naturalHeight || img.height || 800;

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
            return safeResolve(srcStr);
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL('image/jpeg', quality);
          safeResolve(compressed || srcStr);
        } catch (err) {
          console.warn('Canvas compression fallback:', err);
          safeResolve(srcStr);
        }
      };

      img.onerror = (err) => {
        console.warn('Image loading error in compression:', err);
        safeResolve(srcStr);
      };

      img.src = srcStr;
    };

    if (typeof fileOrDataUrl === 'string') {
      processSrc(fileOrDataUrl);
    } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          processSrc(result);
        } else {
          safeResolve('');
        }
      };
      reader.onerror = () => safeResolve('');
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      safeResolve('');
    }
  });
}
