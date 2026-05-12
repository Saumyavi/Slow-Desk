# Project Documents Upload - Setup Guide

## ✅ What's Been Implemented

### 1. Database Schema
- `project_documents` table to store file metadata
- Columns: id, project_id, user_id, file_name, file_size, file_type, storage_path
- RLS policies for secure access

### 2. Database Functions (`lib/supabase/db.ts`)
- `getProjectDocuments(projectId)` - Get all documents for a project
- `uploadProjectDocument(userId, projectId, file)` - Upload file to storage and save metadata
- `deleteProjectDocument(userId, documentId)` - Delete file from storage and database
- `getProjectDocumentUrl(storagePath)` - Get public URL for a document

### 3. UI Components (`app/projects/page.tsx`)
- File upload area in ProjectModal with drag-and-drop style
- Multi-file selection support
- File list with name, size, and remove button
- Accepts: PDF, DOC, DOCX, TXT, MD, JPG, JPEG, PNG

### 4. Upload Logic
- Files are uploaded to Supabase Storage bucket: `project-documents`
- Path structure: `{userId}/{projectId}/{timestamp-random}.{ext}`
- Metadata stored in database after successful upload

## 🚀 Setup Commands

Run these commands in order:

### Step 1: Apply Database Migration

```bash
cd slowdesk
npx supabase db push
```

### Step 2: Create Storage Bucket

You have two options:

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Click "Create bucket"
4. Name: `project-documents`
5. Public bucket: ✅ Yes
6. Click "Create bucket"

**Option B: Via SQL**
```bash
npx supabase db execute --file supabase/storage-setup.sql
```

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## 📋 How to Use

### Creating a Project with Documents

1. Click "New project"
2. Fill in project details
3. Scroll to "Reference Documents (optional)"
4. Click the upload area or browse files
5. Select one or more files
6. Review selected files (you can remove any)
7. Click "Create project"

Files will upload automatically and be associated with the project.

### Supported File Types

- **Documents**: PDF, DOC, DOCX, TXT, MD
- **Images**: JPG, JPEG, PNG
- Size limit: Default Supabase limit (50MB per file)

## 🔧 Storage Configuration

The storage bucket is configured with:
- **Public access**: Yes (users can view their own files via public URLs)
- **RLS policies**: Users can only access their own project documents
- **Path structure**: `{userId}/{projectId}/{filename}`

## 📁 File Structure

```
project-documents/
├── {user-1-id}/
│   ├── {project-a-id}/
│   │   ├── 1778515821347-4qg2gc.pdf
│   │   └── 1778515830244-x9k3mf.png
│   └── {project-b-id}/
│       └── 1778515840123-abc123.docx
└── {user-2-id}/
    └── ...
```

## 🎯 Next Steps (Optional Enhancements)

1. **Display documents in project cards** - Show attached files count
2. **Document viewer** - Preview PDFs and images in modal
3. **Download links** - Allow users to download attached files
4. **File size limits** - Add client-side validation
5. **Drag and drop** - Enable drag-and-drop file upload

## 🐛 Troubleshooting

**Issue: "Bucket does not exist" error**
- Make sure you created the storage bucket (Step 2)
- Check bucket name is exactly: `project-documents`

**Issue: "Permission denied" error**
- Verify RLS policies are set up correctly
- Check user is authenticated

**Issue: Files upload but don't show**
- Check browser console for errors
- Verify storage bucket is public
- Check file metadata is saved to database

## 📊 Database Tables

### project_documents
```sql
id              TEXT PRIMARY KEY
project_id      TEXT (FK -> projects.id)
user_id         UUID (FK -> auth.users.id)
file_name       TEXT
file_size       INTEGER (bytes)
file_type       TEXT (MIME type)
storage_path    TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```
