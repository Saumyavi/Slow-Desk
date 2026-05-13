'use client';
import { useState, useRef, useEffect } from 'react';
import { extractTextFromImage } from '@/lib/ocr';
import { parseTasksFromText, ExtractedTask } from '@/lib/task-parser';
import Icon from '@/components/ui/Icon';

interface CameraCaptureProps {
  onTasksExtracted: (tasks: ExtractedTask[]) => void;
  onClose: () => void;
}

export default function CameraCapture({ onTasksExtracted, onClose }: CameraCaptureProps) {
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open file picker immediately on mount
  useEffect(() => {
    setTimeout(() => fileInputRef.current?.click(), 80);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { onClose(); return; }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!preview) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      setProgress(10);
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 70));
      }, 300);

      const text = await extractTextFromImage(preview);
      clearInterval(progressInterval);
      setProgress(70);

      if (!text || text.trim().length === 0) {
        setError('No text found in image. Try a clearer photo.');
        setProcessing(false);
        return;
      }

      setProgress(75);
      const tasks = parseTasksFromText(text);
      setProgress(90);

      if (tasks.length === 0) {
        setError('No tasks found. Try an image of a to-do list or sticky notes.');
        setProcessing(false);
        return;
      }

      setProgress(100);
      setTimeout(() => onTasksExtracted(tasks), 300);
    } catch {
      setError('Failed to process image. Please try again with a clearer photo.');
      setProcessing(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: 'var(--bg-elev)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>📄</span> Scan Tasks
        </h3>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--bg-sunk)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--line)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-sunk)'}
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/heic" onChange={handleFileUpload} style={{ display: 'none' }} />

      {/* Error */}
      {error && (
        <div style={{ margin: '16px 20px', padding: '12px 16px', background: 'rgba(224,92,60,0.1)', border: '1px solid rgba(224,92,60,0.3)', borderRadius: 8, color: '#e05c3c', fontSize: 13 }}>
          {error}
          <button onClick={() => { setError(null); fileInputRef.current?.click(); }} style={{ marginLeft: 12, fontSize: 12, color: '#e05c3c', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Try again</button>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflow: 'auto' }}>

        {/* Waiting for file — shown if no preview and no error */}
        {!preview && !processing && !error && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
            <div>Select an image to scan…</div>
            <button onClick={() => fileInputRef.current?.click()} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
              Choose file
            </button>
          </div>
        )}

        {/* Preview */}
        {preview && !processing && (
          <div style={{ textAlign: 'center', maxWidth: 600, width: '100%' }}>
            <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 500, borderRadius: 12, marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => { setPreview(null); setError(null); fileInputRef.current?.click(); }} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
                Choose different
              </button>
              <button onClick={processImage} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                Extract Tasks
              </button>
            </div>
          </div>
        )}

        {/* Processing */}
        {processing && (
          <div style={{ textAlign: 'center', color: '#fff', maxWidth: 400 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🤖</div>
            <h4 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Analyzing image…</h4>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>
              {progress < 30 ? 'Initializing OCR engine…' : progress < 70 ? 'Reading text from image…' : progress < 90 ? 'Extracting tasks…' : 'Almost done!'}
            </p>
            <div style={{ width: 240, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', margin: '0 auto' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s ease', borderRadius: 4 }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>{Math.round(progress)}%</div>
          </div>
        )}
      </div>
    </div>
  );
}
