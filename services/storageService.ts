
import { supabase } from './supabaseClient';

export const uploadProfileImage = async (file: File, userId: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop() ?? '';
    const randomPart = Math.random().toString(36).slice(2, 10);
    const fileName = `${userId}-${randomPart}${fileExt ? '.' + fileExt : ''}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }
    const { data: publicData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicData?.publicUrl ?? null;
  } catch (error) {
    console.error('Storage service error:', error);
    return null;
  }
};
