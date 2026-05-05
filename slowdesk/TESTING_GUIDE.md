# 🧪 Photo-to-Task Testing Guide

## Quick Start

1. **Restart your dev server**:
   ```bash
   npm run dev
   ```

2. **Navigate to** http://localhost:3000/tasks

3. **Look for the "📸 Scan" button** next to "New task"

---

## Test Scenarios

### ✅ Test 1: Basic Camera Capture

1. Click "📸 Scan" button
2. Click "📷 Open Camera"
3. Allow camera permissions when prompted
4. Point camera at a to-do list (or any text)
5. Click the white capture button
6. Preview should show your photo
7. Click "Extract Tasks"
8. Wait 2-5 seconds for processing
9. Review modal should show extracted tasks

**Expected:** Tasks are extracted and displayed for review

---

### ✅ Test 2: File Upload

1. Click "📸 Scan" button
2. Click "📁 Upload Photo"
3. Select an image file from your computer
4. Preview should show the image
5. Click "Extract Tasks"
6. Wait for processing
7. Review extracted tasks

**Expected:** Upload works and tasks are extracted

---

### ✅ Test 3: Sample Text Recognition

Create a test image with this text:
```
- Buy groceries
- Call dentist URGENT
- Submit report tomorrow
[ ] Fix bug
TODO: Email client
```

**Expected Results:**
- 5 tasks extracted
- "Call dentist" marked as HIGH priority
- "Submit report" has due date = "tomorrow"

---

### ✅ Test 4: Edit Before Adding

1. Extract some tasks
2. In review modal:
   - Uncheck one task (don't add it)
   - Click on a task title to edit it
   - Change priority dropdown
   - Change due date dropdown
   - Click trash icon to remove a task
3. Click "Add X tasks"

**Expected:** Only selected/edited tasks are added

---

### ✅ Test 5: Priority Detection

Test text:
```
- Normal task
- URGENT: Important task
- Maybe do this someday
- Critical bug fix ASAP
```

**Expected:**
- Task 1: Medium priority
- Task 2: High priority
- Task 3: Low priority
- Task 4: High priority

---

### ✅ Test 6: Due Date Detection

Test text:
```
- Task due today
- Task due tomorrow
- Task this week
- Regular task
```

**Expected:**
- Task 1: due = "today"
- Task 2: due = "tomorrow"
- Task 3: due = "this week"
- Task 4: due = null

---

## 🐛 Known Limitations

### Will Work Well:
- ✅ Printed text (typed or pen)
- ✅ Clear handwriting
- ✅ High contrast photos
- ✅ Well-lit images
- ✅ Bullet points, numbers, checkboxes

### May Struggle:
- ❌ Very messy handwriting
- ❌ Cursive writing
- ❌ Blurry photos
- ❌ Low light/shadows
- ❌ Colored backgrounds
- ❌ Text at extreme angles

---

## 📸 Sample Images to Test With

### Option 1: Create Your Own
1. Write a to-do list on paper
2. Use bullet points or numbers
3. Take a clear photo with good lighting

### Option 2: Use Digital Text
1. Type a to-do list in Notepad
2. Take a screenshot
3. Upload the screenshot

### Option 3: Use Sticky Notes
1. Write tasks on sticky notes
2. Arrange them on a desk
3. Take a photo from above

---

## ✅ Success Criteria

- [ ] Camera opens and shows live preview
- [ ] Capture button works
- [ ] File upload works
- [ ] OCR extracts text (check console logs)
- [ ] Tasks are detected and shown in review modal
- [ ] Can edit tasks before adding
- [ ] Priority/due date detection works
- [ ] Tasks save to database
- [ ] Tasks appear in task list after adding
- [ ] Mobile responsive (test on phone)

---

## 🔧 Debugging

### If Camera Doesn't Open:
- Check browser console for errors
- Ensure HTTPS or localhost (camera requires secure context)
- Check browser camera permissions

### If No Text Extracted:
- Check console logs for OCR errors
- Try a clearer/simpler image
- Ensure image has actual text

### If No Tasks Found:
- OCR worked but pattern matching failed
- Try adding bullet points or "TODO:" prefix
- Use action verbs (buy, call, send, etc.)

### If Processing Takes Too Long:
- Tesseract.js can take 3-7 seconds for large images
- Try compressing the image first
- Close other browser tabs

---

## 📊 Performance Benchmarks

Test on different devices and note processing times:

| Device | Image Size | Processing Time |
|--------|------------|-----------------|
| Desktop | 1MB | ~2-3 seconds |
| Mobile | 800KB | ~3-5 seconds |
| Large image | 3MB+ | ~5-10 seconds |

---

## 🎯 Next Steps After Testing

1. **If working well**: 
   - Commit the feature
   - Consider adding to Dashboard as FAB button

2. **If issues found**:
   - Check console logs for errors
   - Test with different images
   - Adjust pattern matching in `task-parser.ts`

3. **Future enhancements**:
   - Image preprocessing for better accuracy
   - Multiple language support
   - Batch image processing
   - Show confidence scores

---

**Ready to test! Start your server and try scanning your first to-do list!** 🚀
