import { supabase } from './supabaseClient';

interface UploadInput {
    fileBlobOrBase64: Blob | string;
    userId: string;
    filename?: string;
    isBase64?: boolean;
}

export async function uploadAvatar({ fileBlobOrBase64, userId, filename = 'upload.png', isBase64 = false }: UploadInput) {
    const BUCKET = 'Avatars'; // Capitalized to match @jeymuleya's working setup

    // Convert base64 to Blob if needed
    function base64ToBlob(base64: string, mimeType: string) {
        const cleaned = base64.startsWith('data:') ? base64.split(',')[1] : base64;
        const byteChars = atob(cleaned);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    const ext = filename.split('.').pop() || 'png';
    
    let blob: Blob;
    if (isBase64 && typeof fileBlobOrBase64 === 'string') {
        blob = base64ToBlob(fileBlobOrBase64, `image/${ext}`);
    } else if (fileBlobOrBase64 instanceof Blob) {
        blob = fileBlobOrBase64;
    } else {
        if (typeof fileBlobOrBase64 === 'string') {
             blob = base64ToBlob(fileBlobOrBase64, `image/${ext}`);
        } else {
             throw new Error('Invalid file input');
        }
    }

    // Path structure: userId/timestamp_random.ext
    const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    // 1. Upload to Storage
    console.log(`Attempting upload to bucket: ${BUCKET}, path: ${path}`);
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, {
            upsert: true,
            contentType: blob.type
        });

    if (uploadError) {
        console.error("Supabase Storage Upload Error:", uploadError);
        // Fallback: Try lowercase 'avatars' if capitalized fails
        if (uploadError.message.includes('not found') || uploadError.message.includes('bucket')) {
             console.log("Retrying with lowercase 'avatars' bucket...");
             const { data: retryData, error: retryError } = await supabase.storage
                .from('avatars')
                .upload(path, blob, { upsert: true, contentType: blob.type });
             
             if (retryError) throw new Error(`Upload failed (both buckets): ${retryError.message}`);
             // If success, proceed with 'avatars'
             const { data: { publicUrl: retryUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
             return updateProfileWithUrl(userId, retryUrl, path);
        }
        throw new Error(`Upload failed: ${uploadError.message}`);
    }
    console.log("Supabase Storage Upload Success:", uploadData);

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

    console.log("Generated Public URL:", publicUrl);

    return updateProfileWithUrl(userId, publicUrl, path);
}

async function updateProfileWithUrl(userId: string, publicUrl: string, path: string) {
    // 3. Update Profile in Database
    // We use upsert to ensure the row exists if it was missing
    const { data: profileData, error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
            id: userId,
            avatar_url: publicUrl,
            updated_at: new Date().toISOString()
        })
        .select();

    if (updateError) {
        console.error("Supabase Profile Update Error:", updateError);
        throw new Error(`Profile update failed: ${updateError.message}`);
    }

    console.log("Avatar upload successful. Profile updated:", profileData);

    return {
        path,
        url: publicUrl
    };
}
