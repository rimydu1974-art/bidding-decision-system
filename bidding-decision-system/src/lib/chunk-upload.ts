const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB per chunk
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max
const MAX_RETRIES = 3;

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
  stage: 'uploading' | 'merging' | 'done';
}

export interface ChunkUploadResult {
  complete: boolean;
  uploadId: string;
  fileName: string;
  fileSize: number;
  filePath?: string;
  received?: number;
  total?: number;
}

function generateUploadId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

async function uploadChunk(
  uploadId: string,
  chunk: Blob,
  chunkIndex: number,
  totalChunks: number,
  fileName: string,
  fileSize: number,
  token: string
): Promise<ChunkUploadResult> {
  const formData = new FormData();
  formData.append('uploadId', uploadId);
  formData.append('chunkIndex', chunkIndex.toString());
  formData.append('totalChunks', totalChunks.toString());
  formData.append('fileName', fileName);
  formData.append('fileSize', fileSize.toString());
  formData.append('chunk', chunk);

  const response = await fetch('/api/upload/chunk', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `分片 ${chunkIndex + 1} 上传失败`);
  }

  return response.json();
}

export async function uploadFileInChunks(
  file: File,
  token: string,
  onProgress?: (progress: UploadProgress) => void,
  customChunkSize?: number
): Promise<ChunkUploadResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('文件大小不能超过100MB');
  }

  // Small file - upload directly as single chunk
  if (file.size <= CHUNK_SIZE) {
    onProgress?.({ loaded: 0, total: file.size, percent: 0, stage: 'uploading' });
    const result = await uploadChunk(
      generateUploadId(),
      file,
      0,
      1,
      file.name,
      file.size,
      token
    );
    onProgress?.({ loaded: file.size, total: file.size, percent: 100, stage: 'done' });
    return result;
  }

  const chunkSize = customChunkSize || CHUNK_SIZE;
  const totalChunks = Math.ceil(file.size / chunkSize);
  const uploadId = generateUploadId();

  onProgress?.({ loaded: 0, total: file.size, percent: 0, stage: 'uploading' });

  // Upload chunks with retry
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    let lastError: Error | null = null;
    for (let retry = 0; retry < MAX_RETRIES; retry++) {
      try {
        const result = await uploadChunk(
          uploadId,
          chunk,
          i,
          totalChunks,
          file.name,
          file.size,
          token
        );

        // Update progress
        const loaded = Math.min((i + 1) * chunkSize, file.size);
        onProgress?.({
          loaded,
          total: file.size,
          percent: Math.round((loaded / file.size) * 90), // 0-90% for upload
          stage: 'uploading',
        });

        // If complete (all chunks received)
        if (result.complete) {
          onProgress?.({
            loaded: file.size,
            total: file.size,
            percent: 100,
            stage: 'done',
          });
          return result;
        }

        lastError = null;
        break; // Success, move to next chunk
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Chunk ${i + 1} retry ${retry + 1}/${MAX_RETRIES}:`, lastError.message);
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retry + 1)));
      }
    }

    if (lastError) {
      throw new Error(`分片 ${i + 1}/${totalChunks} 上传失败: ${lastError.message}`);
    }
  }

  // Should not reach here, but handle edge case
  return {
    complete: false,
    uploadId,
    fileName: file.name,
    fileSize: file.size,
    received: totalChunks,
    total: totalChunks,
  };
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop() || '';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
