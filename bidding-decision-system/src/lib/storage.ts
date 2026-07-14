import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(supabaseUrl, supabaseKey);
}

export async function uploadFileToStorage(
  file: File,
  bucket: string = 'uploads',
  path?: string
): Promise<{ url: string; path: string }> {
  const supabase = getSupabase();
  const filePath = path || `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return { url: urlData.publicUrl, path: filePath };
}

export async function downloadFileFromStorage(
  url: string
): Promise<{ buffer: ArrayBuffer; fileName: string; contentType: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const contentDisposition = response.headers.get('content-disposition') || '';
  const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  const fileName = fileNameMatch ? fileNameMatch[1].replace(/['"]/g, '') : 'downloaded-file';

  const buffer = await response.arrayBuffer();
  return { buffer, fileName, contentType };
}

export async function deleteFileFromStorage(
  bucket: string = 'uploads',
  paths: string[]
): Promise<void> {
  const supabase = getSupabase();
  await supabase.storage.from(bucket).remove(paths);
}
