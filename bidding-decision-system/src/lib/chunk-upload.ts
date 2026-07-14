const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
  stage: 'uploading' | 'done';
}

export interface UploadResult {
  complete: boolean;
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

export function getAuthToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match ? match[1] : '';
}

export async function uploadFileToStorage(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('文件大小不能超过100MB');
  }

  onProgress?.({ loaded: 0, total: file.size, percent: 0, stage: 'uploading' });

  const bucket = 'uploads';
  const filePath = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;

  // Use XMLHttpRequest for progress tracking with Supabase REST API
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    // Fallback: upload via our own API endpoint
    return uploadViaApi(file, onProgress);
  }

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);
    xhr.setRequestHeader('apikey', supabaseKey);
    xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.({
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
          stage: 'uploading',
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
        onProgress?.({ loaded: file.size, total: file.size, percent: 100, stage: 'done' });
        resolve({
          complete: true,
          fileUrl: publicUrl,
          fileName: file.name,
          fileSize: file.size,
        });
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

async function uploadViaApi(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  // Fallback: upload via our own chunk API
  const CHUNK_SIZE = 4 * 1024 * 1024;
  const token = getAuthToken();

  if (file.size <= CHUNK_SIZE) {
    onProgress?.({ loaded: 0, total: file.size, percent: 0, stage: 'uploading' });
    const formData = new FormData();
    formData.append('uploadId', `${Date.now()}-${Math.random().toString(36).substring(2)}`);
    formData.append('chunkIndex', '0');
    formData.append('totalChunks', '1');
    formData.append('fileName', file.name);
    formData.append('fileSize', file.size.toString());
    formData.append('chunk', file);

    const res = await fetch('/api/upload/chunk', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    onProgress?.({ loaded: file.size, total: file.size, percent: 100, stage: 'done' });
    return {
      complete: data.complete,
      fileUrl: data.filePath || '',
      fileName: file.name,
      fileSize: file.size,
    };
  }

  throw new Error('Supabase Storage not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
