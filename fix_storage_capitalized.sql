-- Allow public access to Avatars (capitalized)
drop policy if exists "Public Access Avatars" on storage.objects;
create policy "Public Access Avatars"
on storage.objects for select
using ( bucket_id = 'Avatars' );

-- Allow authenticated users to upload Avatars (capitalized)
drop policy if exists "Authenticated users can upload Avatars" on storage.objects;
create policy "Authenticated users can upload Avatars"
on storage.objects for insert
with check ( bucket_id = 'Avatars' and auth.role() = 'authenticated' );

-- Allow users to update their own Avatars (capitalized)
drop policy if exists "Users can update own Avatars" on storage.objects;
create policy "Users can update own Avatars"
on storage.objects for update
using ( bucket_id = 'Avatars' and auth.uid() = owner )
with check ( bucket_id = 'Avatars' and auth.uid() = owner );

-- Allow users to delete their own Avatars (capitalized)
drop policy if exists "Users can delete own Avatars" on storage.objects;
create policy "Users can delete own Avatars"
on storage.objects for delete
using ( bucket_id = 'Avatars' and auth.uid() = owner );
