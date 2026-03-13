-- Create avatars bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Allow public access to avatars
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatars
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
on storage.objects for insert
with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- Allow users to update their own avatars
drop policy if exists "Users can update own avatars" on storage.objects;
create policy "Users can update own avatars"
on storage.objects for update
using ( bucket_id = 'avatars' and auth.uid() = owner )
with check ( bucket_id = 'avatars' and auth.uid() = owner );

-- Allow users to delete their own avatars
drop policy if exists "Users can delete own avatars" on storage.objects;
create policy "Users can delete own avatars"
on storage.objects for delete
using ( bucket_id = 'avatars' and auth.uid() = owner );
