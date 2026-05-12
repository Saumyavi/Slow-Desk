# Storage Bucket Setup Guide

## ⚠️ IMPORTANT: You must create the storage bucket manually

The storage bucket **MUST** be created before uploading files, or you'll get a 403 error.

## 📋 Step-by-Step Setup

### Option 1: Via Supabase Dashboard (RECOMMENDED)

1. **Go to your Supabase Project Dashboard**
   - URL: https://supabase.com/dashboard/project/[your-project-id]

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar

3. **Create New Bucket**
   - Click the "New bucket" button (top right)
   - OR click "Create a new bucket" if you have no buckets

4. **Configure Bucket Settings**
   ```
   Name:   project-documents
   Public: ✅ YES (check this box)
   ```

5. **Click "Create bucket"**

6. **Verify Policies (Optional)**
   - Click on the `project-documents` bucket
   - Go to "Policies" tab
   - You should see policies allowing authenticated users to upload/read

### Option 2: Via SQL (Alternative)

If the dashboard method doesn't work, run this in your Supabase SQL Editor:

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  true,
  52428800,  -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;
```

## ✅ Verify Setup

After creating the bucket, test it:

1. Go to your app: `http://localhost:3000/projects`
2. Click "New project"
3. Scroll to "Reference Documents"
4. Try uploading a file
5. Check browser console for errors

## 🐛 Common Issues

### Error: "new row violates row-level security policy"

**Fix:**
1. Make sure you ran the migration: `npx supabase db push`
2. Verify the bucket exists in Supabase Dashboard → Storage
3. Check you're logged in (authenticated)

### Error: "Bucket not found"

**Fix:**
1. Bucket name MUST be exactly: `project-documents`
2. Create bucket via dashboard (Option 1 above)

### Error: "Permission denied"

**Fix:**
1. Make sure bucket is set to **Public**
2. Check RLS policies are enabled on `project_documents` table

## 📊 Expected Storage Structure

After upload, files will be organized like this:

```
project-documents/
├── {user-uuid}/
│   ├── {project-id-1}/
│   │   ├── 1234567890-abc123.pdf
│   │   └── 1234567891-def456.png
│   └── {project-id-2}/
│       └── 1234567892-ghi789.docx
```

## 🔒 Security

- ✅ Users can only upload to their own folder (`{user-id}/`)
- ✅ Users can only view their own files
- ✅ Files are deleted when projects are deleted (CASCADE)
- ✅ 50MB file size limit per file

## 📞 Need Help?

If you're still getting errors:
1. Check browser console (F12) for detailed error messages
2. Check Supabase Dashboard → Storage → Logs
3. Verify your Supabase project has storage enabled
