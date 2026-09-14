// Inline (base64) CV handling, used when Firebase Storage is unavailable.
// Firestore documents are capped at 1 MiB, so only small files are embedded.
export const INLINE_CV_MAX_BYTES = 600 * 1024;

export const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const downloadDataUrl = (dataUrl, filename) => {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename || 'cv';
  document.body.appendChild(a);
  a.click();
  a.remove();
};
