export const DOCUMENT_MAX_MB = 10;
export const DOCUMENT_MAX_BYTES = DOCUMENT_MAX_MB * 1024 * 1024;
export const DOCUMENT_SIZE_ERROR = `Each document must be ${DOCUMENT_MAX_MB} MB or smaller.`;

export function validateDocumentFile(file: {type?: string | null; size?: number | null; fileSize?: number | null}) {
  if (!['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type || '')) {
    throw new Error('Choose a JPG, PNG or PDF document.');
  }
  const size = file.size ?? file.fileSize;
  if (size != null && (!Number.isFinite(size) || size < 0 || size > DOCUMENT_MAX_BYTES)) {
    throw new Error(DOCUMENT_SIZE_ERROR);
  }
}
