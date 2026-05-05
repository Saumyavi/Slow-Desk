'use client';
import { useState, useRef, useEffect } from 'react';
import { extractTextFromImage } from '@/lib/ocr';
import { parseTasksFromText, ExtractedTask } from '@/lib/task-parser';
import Icon from './Icon';

interface CameraCaptureProps {
  onTasksExtracted: (tasks: ExtractedTask[]) => void;
  onClose: () => void;
}

export default function CameraCapture({ onTasksExtracted, onClose }: CameraCaptureProps) {
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      setCapturing(true); // Show video element first
      console.log('Requesting camera access...');

      // Wait a bit for the video element to render
      await new Promise(resolve => setTimeout(resolve, 100));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      });

      console.log('Camera access granted, stream:', stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Ensure video starts playing
        try {
          await videoRef.current.play();
          console.log('Video playing');
        } catch (playErr) {
          console.error('Video play error:', playErr);
        }
      } else {
        console.error('Video ref not available after waiting');
        setError('Camera initialization failed. Please try again.');
        setCapturing(false);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError(`Camera access failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please check browser permissions.`);
      setCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(imageData);

    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!preview) return;

    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Extract text (0-70%)
      setProgress(10);

      // Simulate progress during OCR (since we can't track it directly)
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

      // Step 2: Parse tasks (70-90%)
      setProgress(75);
      const tasks = parseTasksFromText(text);
      setProgress(90);

      if (tasks.length === 0) {
        setError('No tasks found. Try taking a photo of a to-do list or sticky notes.');
        setProcessing(false);
        return;
      }

      // Step 3: Complete (90-100%)
      setProgress(100);

      // Small delay to show 100% before closing
      setTimeout(() => {
        onTasksExtracted(tasks);
      }, 300);

    } catch (err) {
      console.error('Image processing failed:', err);
      setError('Failed to process image. Please try again with a clearer photo.');
      setProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'var(--bg-elev)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--line)',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>📸</span>
          Scan Tasks
        </h3>
        <button onClick={() => { stopCamera(); onClose(); }} style={{
          width: 32, height: 32, borderRadius: 8, border: 'none',
          background: 'var(--bg-sunk)', cursor: 'pointer',
          display: 'grid', placeItems: 'center', transition: 'all 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--line)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-sunk)'}
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          margin: '16px 20px',
          padding: '12px 16px',
          background: 'rgba(224, 92, 60, 0.1)',
          border: '1px solid rgba(224, 92, 60, 0.3)',
          borderRadius: 8,
          color: '#e05c3c',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Main content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        overflow: 'auto',
      }}>
        {!capturing && !preview && !processing && (
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>📷</div>
            <h4 style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
              Capture Your Tasks
            </h4>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
              Take a photo of printed task lists, typed notes, or digital screens. We'll extract the tasks automatically using OCR.
            </p>

            {/* Tips */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              padding: '16px',
              marginBottom: 24,
              textAlign: 'left',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>
                💡 Tips for best results:
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
                <li>Works best with printed or typed text</li>
                <li>Use good lighting</li>
                <li>Hold phone steady</li>
                <li>Ensure text is clear and readable</li>
                <li>Avoid shadows on the text</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={startCamera} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: 14 }}>
                <span style={{ marginRight: 8 }}>📷</span>
                Open Camera
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: 14 }}>
                <span style={{ marginRight: 8 }}>📁</span>
                Upload Photo
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {capturing && (
          <div style={{ width: '100%', maxWidth: 600, position: 'relative' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                borderRadius: 12,
                background: '#000',
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 16,
              alignItems: 'center',
            }}>
              <button
                onClick={() => { stopCamera(); }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid #fff',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                }}
              >
                <Icon name="x" size={24} />
              </button>
              <button
                onClick={capturePhoto}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: '#fff',
                  border: '4px solid var(--accent)',
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>
        )}

        {preview && !processing && (
          <div style={{ textAlign: 'center', maxWidth: 600, width: '100%' }}>
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: 500,
                borderRadius: 12,
                marginBottom: 20,
              }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => { setPreview(null); setError(null); }}
                className="btn btn-secondary"
                style={{ padding: '10px 20px' }}
              >
                Retake
              </button>
              <button
                onClick={processImage}
                className="btn btn-primary"
                style={{ padding: '10px 20px' }}
              >
                Extract Tasks
              </button>
            </div>
          </div>
        )}

        {processing && (
          <div style={{ textAlign: 'center', color: '#fff', maxWidth: 400 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🤖</div>
            <h4 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Analyzing image...
            </h4>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>
              {progress < 30 && 'Initializing OCR engine...'}
              {progress >= 30 && progress < 70 && 'Reading text from image...'}
              {progress >= 70 && progress < 90 && 'Extracting tasks...'}
              {progress >= 90 && 'Almost done!'}
            </p>
            <div style={{
              width: 240,
              height: 8,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 4,
              overflow: 'hidden',
              margin: '0 auto',
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--accent)',
                transition: 'width 0.3s ease',
                borderRadius: 4,
              }} />
            </div>
            <div style={{
              marginTop: 8,
              fontSize: 12,
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'var(--font-mono)',
            }}>
              {Math.round(progress)}%
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
