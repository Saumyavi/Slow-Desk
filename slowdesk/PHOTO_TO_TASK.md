# 📸 Photo-to-Task Feature

## Overview

Convert photos of sticky notes, whiteboards, or handwritten lists into actionable tasks automatically using **100% free client-side OCR** (no API costs!).

---

## ✨ Features

- 📷 **Camera Capture** - Use device camera or upload existing photos
- 🤖 **OCR Processing** - Extract text using Tesseract.js (runs in browser)
- 🎯 **Smart Task Detection** - Automatically identifies tasks from text
- 🏷️ **Priority Detection** - Detects "urgent", "asap", "important" keywords
- 📅 **Due Date Parsing** - Recognizes "today", "tomorrow", "this week"
- ✏️ **Review & Edit** - Review and modify extracted tasks before adding
- ✅ **Batch Creation** - Add multiple tasks at once

---

## 🎯 How It Works

```
1. User clicks "Scan" button
   ↓
2. Takes photo or uploads image
   ↓
3. Tesseract.js extracts text (2-5 seconds)
   ↓
4. Pattern matching identifies tasks
   ↓
5. User reviews and edits tasks
   ↓
6. Tasks added to Supabase
```

---

## 📦 Technology Stack

### **Tesseract.js** (Free OCR)
- ✅ Completely free
- ✅ Runs in browser (client-side)
- ✅ No API costs
- ✅ No backend needed
- ✅ Supports 100+ languages
- ⚠️ ~2MB library size
- ⚠️ Processing time: 2-5 seconds

### **Pattern Matching**
Smart task detection patterns:
- Bullet points (`-`, `•`, `*`)
- Numbered lists (`1.`, `1)`)
- Checkboxes (`[ ]`, `[x]`)
- TODO markers (`TODO:`, `Task:`)
- Action verbs (buy, call, send, fix, etc.)

### **Priority Detection**
Automatically detects:
- **High**: urgent, asap, important, critical, !!!
- **Medium**: default
- **Low**: maybe, someday, optional

### **Due Date Detection**
Recognizes:
- **Today**: today, asap, now
- **Tomorrow**: tomorrow, tmr
- **This week**: this week, by Friday, by weekend

---

## 📁 File Structure

```
slowdesk/
├── lib/
│   ├── ocr.ts                    # Tesseract.js wrapper
│   └── task-parser.ts            # Task pattern matching logic
├── components/
│   ├── CameraCapture.tsx         # Camera UI + image processing
│   ├── TaskReview.tsx            # Review extracted tasks
│   └── Icon.tsx                  # Added 'camera' icon
└── app/
    └── tasks/
        └── page.tsx              # Integrated scan button
```

---

## 🎨 UI Flow

### **1. Scan Button**
Located on Tasks page next to "New task" button

```
[📸 Scan] [➕ New task]
```

### **2. Camera Modal**
- Full-screen camera view
- Option to upload photo
- Tips for best results
- Real-time video preview
- Capture button

### **3. Processing**
- Progress bar (0-100%)
- Status messages:
  - "Initializing OCR engine..."
  - "Reading text from image..."
  - "Extracting tasks..."
  - "Almost done!"

### **4. Review Modal**
- List of extracted tasks
- Checkbox to select/deselect
- Edit task title inline
- Change priority dropdown
- Change due date dropdown
- Remove unwanted tasks
- Shows count: "Add 3 tasks"

---

## 💰 Cost Analysis

### **Free Version (Current)**
- Cost: **$0/month**
- Processing: Client-side
- Speed: 2-5 seconds
- Accuracy: 85-95% on printed text

### **Paid Alternative (Claude API)**
- Cost: ~$3 per 1000 images
- Processing: API call
- Speed: 1-2 seconds
- Accuracy: 95-99% (better on handwriting)

**Conclusion:** Start with free version, upgrade to paid API later if needed.

---

## 🚀 Usage Instructions

### For Users:

1. **Go to Tasks page**
2. **Click "📸 Scan" button**
3. **Take a photo** or upload existing one
   - Tip: Use good lighting
   - Tip: Hold phone steady
   - Tip: Ensure text is clear
4. **Wait for processing** (2-5 seconds)
5. **Review extracted tasks**
   - Edit titles if needed
   - Adjust priority/due dates
   - Remove unwanted items
6. **Click "Add X tasks"**
7. **Done!** Tasks appear in your list

---

## 📊 Pattern Detection Examples

### What It Recognizes:

✅ `- Buy groceries` (bullet point)  
✅ `• Call dentist` (bullet point)  
✅ `1. Submit report` (numbered list)  
✅ `[ ] Fix bug` (checkbox)  
✅ `TODO: Email client` (TODO marker)  
✅ `Buy milk` (action verb)  
✅ `Call John ASAP` (detected as high priority + today)  
✅ `Meeting tomorrow at 2pm` (detected due: tomorrow)  

### What It Might Miss:

❌ Very messy handwriting  
❌ Cursive text  
❌ Text at extreme angles  
❌ Very low contrast photos  
❌ Blurry images  

---

## 🔧 Technical Details

### Dependencies Added:
```json
{
  "tesseract.js": "^5.0.0"
}
```

### Key Functions:

#### `lib/ocr.ts`
- `extractTextFromImage()` - Main OCR function
- `preprocessImage()` - Optional image enhancement

#### `lib/task-parser.ts`
- `parseTasksFromText()` - Extract tasks from text
- `detectPriority()` - Identify priority level
- `detectDueDate()` - Parse due dates
- `cleanTaskTitle()` - Clean and format titles
- `getTasksSummary()` - Generate summary text

#### `components/CameraCapture.tsx`
- Camera access and capture
- File upload handling
- Image processing coordination
- Progress tracking

#### `components/TaskReview.tsx`
- Task selection UI
- Inline editing
- Priority/due date dropdowns
- Batch confirmation

---

## 🎯 Accuracy Tips

### Best Results:
- 📝 Printed text (pen on sticky notes)
- 💡 Good lighting (no shadows)
- 📱 Hold phone steady
- 🔍 High contrast (dark text on light background)
- 📐 Text at 0° angle (not tilted)

### May Struggle With:
- ✍️ Very messy handwriting
- 🌙 Low light photos
- 📸 Blurry images
- 🎨 Colored backgrounds
- 🔄 Rotated text

---

## 🚀 Future Enhancements

### Potential Improvements:
1. **Auto-rotate detection** - Detect and correct image rotation
2. **Multi-language support** - Add more languages beyond English
3. **Batch processing** - Process multiple images at once
4. **Smart categorization** - Auto-assign to projects
5. **Receipt parsing** - Extract expense tasks from receipts
6. **Calendar integration** - Sync detected dates to calendar
7. **Offline queue** - Queue processing when offline
8. **History** - Show recently scanned images

### Optional Paid Upgrade:
- Add Claude API as "Pro" feature for better handwriting recognition
- Toggle between free (Tesseract) and paid (Claude) in settings
- Cost: ~$0.003 per scan

---

## 🐛 Troubleshooting

### "No text found in image"
- Ensure text is clearly visible
- Check lighting (avoid shadows)
- Try zooming in on text
- Retake with steadier hand

### "No tasks found"
- OCR succeeded but no task patterns detected
- Try adding bullet points or numbers
- Use action verbs (buy, call, send, etc.)
- Add "TODO:" prefix to items

### "Camera access denied"
- Check browser permissions
- Allow camera access when prompted
- Try uploading a photo instead

### "Processing takes too long"
- Tesseract.js can take 3-7 seconds for large images
- Try compressing image first
- Close other tabs to free up memory

---

## ✅ Testing Checklist

- [x] Camera opens and shows live preview
- [x] Capture button takes photo
- [x] File upload works
- [x] OCR extracts text from sample image
- [x] Task patterns detected correctly
- [x] Priority detection works
- [x] Due date detection works
- [x] Review modal displays tasks
- [x] Edit task titles inline
- [x] Change priority/due date
- [x] Remove tasks before adding
- [x] Tasks saved to Supabase
- [x] Mobile responsive
- [x] Error handling works

---

## 📝 Notes

- Feature uses 100% client-side processing (no API calls)
- Privacy-friendly: images never leave the browser
- Works offline once page is loaded
- Bundle size increases by ~2MB (Tesseract.js)
- Processing time varies by device performance
- Accuracy: 85-95% on clear printed text

---

**Ready to use! Click "📸 Scan" on the Tasks page to try it out!** 🎉
