import { supabase } from '../supabaseClient';

export interface UploadAvatarResult {
    path: string;
    url: string;
}

/**
 * Uploads an avatar image to Supabase Storage and updates the user's profile.
 * 
 * @param userId - The UUID of the user.
 * @param file - The file object to upload.
 * @returns Promise resolving to the upload result containing path and URL.
 */
export const uploadAvatar = async (userId: string, file: File): Promise<UploadAvatarResult> => {
    if (!userId) throw new Error('User ID is required for avatar upload.');
    
    const BUCKET = 'Avatars';
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
            upsert: false
        });

    if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 2. Get Public URL (defaulting to public bucket strategy as per App.tsx context)
    // If the bucket is private, we would use createSignedUrl, but for avatars public is standard.
    // The user's snippet handled both, so we'll try to be robust.
    
    let finalUrl: string | null = null;

    // Attempt to get public URL
    const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);
    
    if (publicUrlData) {
        finalUrl = publicUrlData.publicUrl;
    }

    // If we wanted to support private buckets strictly, we'd check if public URL is accessible
    // or just use signed URL. For this app, we'll assume public access is preferred for avatars.
    
    if (!finalUrl) {
        throw new Error('Failed to obtain a file URL.');
    }

    // 3. Persist to 'profiles' table
    // This matches the user's snippet requirement to update a table, not just metadata.
    const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            avatar_url: filePath, // Storing path as per snippet, or could be full URL
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

    if (dbError) {
        // Optional: Clean up uploaded file if DB write fails
        await supabase.storage.from(BUCKET).remove([filePath]);
        throw new Error(`DB upsert failed: ${dbError.message}`);
    }

    // 4. Also update auth metadata to keep App.tsx state in sync without a reload
    // This is an extra step to ensure the UI updates immediately if it relies on user_metadata
    await supabase.auth.updateUser({
        data: { avatarUrl: finalUrl }
    });

    return {
        path: filePath,
        url: finalUrl
    };
};
