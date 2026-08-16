// ─────────────────────────────────────────────────────────────────────────────
// PhotoAttach.tsx — shared employee-photo capture + display.
//
// Two exports, one shared storage convention:
//
//  - `PhotoUploadField`  — a file-picker with live preview/remove, meant
//    for the form itself (e.g. the "identity" step in EmployeeForm.tsx).
//    Lets the user attach, replace, or remove the employee's photo.
//
//  - `PhotoDisplayBox`   — a fixed-box renderer for PrintFiles/*.tsx
//    documents. Drop it in wherever a document currently has a
//    placeholder photo box (IdCard's `.idc-photo-box`, Medical Fitness
//    Certificate's photo `<td>`, etc.) — it shows the real photo when
//    one is attached, and falls back to the exact same placeholder
//    label/box those documents already had when it isn't.
//
// STORAGE: the photo is kept as a base64 data URL in a single new string
// field on EmployeeFormData — `photo?: string`. That field isn't in
// employee.types.ts yet; add it there:
//
//     export interface EmployeeFormData {
//       ...
//       photo?: string;
//     }
//
// Until it's added, everything here still works at runtime (reading and
// writing formData.photo doesn't require the type to declare it — same
// escape hatch NomineeForm.tsx already uses for its own not-yet-typed
// fields), it just needs `(formData as any).photo` on the read side so
// TypeScript doesn't complain. Once the field is added to the real type,
// that cast can be dropped.
//
// Storing it as a plain base64 string (not a separate blob/file) is
// deliberate: it's the only storage EmployeeFileSystem.tsx has for any
// field — buildRecord() flattens the whole EmployeeFormData shape into
// one Record<string,string> and saves it via useDatabase, so `photo`
// round-trips through save/load/search exactly like every other text
// field, with zero changes needed to buildRecord()/recordToFormData().
//
// SIZE LIMIT: 2MB raw file size, enforced before the base64 read even
// starts. Base64 inflates size by ~33% on top of that, and this value
// gets saved as one field on every employee record (Google Sheets
// adapter, via useDatabase) — an unbounded photo would bloat every
// single save/load/search of the whole sheet, not just this one record.
// 2MB is generous for a passport-style ID photo (typically well under
// 300KB) while still catching an accidental full-resolution camera photo.
//
// AUDIT ADDITION: live camera capture alongside file upload —
// `PhotoUploadField` now has a "ছবি তুলুন" (Take Photo) button next to
// Upload/Change, for offices without a scanner/existing photo file
// handy. Opens the device camera via getUserMedia() in a small modal;
// the captured frame is drawn to an off-screen <canvas> and read back
// out as a JPEG data URL through the exact same onChange(dataUrl) path
// file upload already uses — capture and upload are two input methods
// feeding the same single `photo` field, not two separate concepts.
// Camera access requires HTTPS (or localhost) per browser security
// policy; on plain HTTP, getUserMedia rejects immediately and the UI
// falls back to a "ছবি আপলোড করুন" hint rather than failing silently.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useState, useEffect, ChangeEvent, DragEvent, KeyboardEvent } from 'react';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB

// ── Upload field (for the form) ────────────────────────────────────────────

interface PhotoUploadFieldProps {
  /** Current photo as a base64 data URL, if one is attached. */
  value?: string;
  /** Called with the new data URL on attach/replace, or `undefined` on remove. */
  onChange: (dataUrl: string | undefined) => void;
  label?: string;
  hint?: string;
}

export const PhotoUploadField: React.FC<PhotoUploadFieldProps> = ({
  value, onChange, label = 'ছবি', hint = 'JPG/PNG, সর্বোচ্চ ২ MB',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError]             = useState('');
  const [dragOver, setDragOver]       = useState(false);
  const [cameraOpen, setCameraOpen]   = useState(false);
  const [cameraError, setCameraError] = useState('');

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  // Safety net: if the user navigates off this step (unmounting the
  // field) while the camera modal is still open, the stream would
  // otherwise keep the camera light on indefinitely with no UI left to
  // stop it from.
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  // Attaches the live stream to the <video> element once the modal has
  // actually mounted it — can't set srcObject before the element exists.
  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => { /* autoplay races are harmless here */ });
    }
  }, [cameraOpen]);

  const openCamera = async () => {
    setError('');
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('এই ব্রাউজারে লাইভ ক্যামেরা সমর্থিত নয় — ছবি আপলোড করুন');
      return;
    }
    try {
      // 'user' (front-facing) is the right default for an ID/passport-
      // style self-photo taken at a desk — 'environment' would default
      // to a phone's rear camera, which is the wrong one for this.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 800 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError('ক্যামেরা চালু করা যায়নি — অনুমতি দিন অথবা ছবি আপলোড করুন');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    // videoWidth is 0 until the stream has actually started decoding a
    // frame — guards against capturing a blank canvas if the button is
    // somehow clicked in that brief window.
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    onChange(canvas.toDataURL('image/jpeg', 0.9));
    stopCamera();
  };

  const handleFile = (file: File | undefined | null) => {
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('শুধুমাত্র ছবি ফাইল (JPG/PNG) আপলোড করুন');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('ছবির সাইজ ২ MB এর কম হতে হবে');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result);
    };
    reader.onerror = () => setError('ছবি পড়তে সমস্যা হয়েছে, আবার চেষ্টা করুন');
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    // Reset so selecting the SAME file again (e.g. re-attach after
    // removing) still fires onChange — browsers don't emit a change
    // event if the input's value hasn't changed.
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const openPicker = () => inputRef.current?.click();

  const handleBoxKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); }
  };

  return (
    // AUDIT FIX: was left-aligned (flex-start default) inside a
    // max-width column — fine when sitting next to other left-aligned
    // form fields, but this field renders alone on its own step page
    // (see EmployeeFileSystem.tsx's 'photo' step), where left-aligned
    // content just sits awkwardly in the top-left corner of a wide,
    // otherwise-empty page. margin: '0 auto' centers the column itself
    // horizontally; alignItems + textAlign center everything inside it
    // (label, box, button row, hint/error text) to match.
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, maxWidth: 220, margin: '0 auto', textAlign: 'center' }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>

      <div
        onClick={openPicker}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label={value ? `${label} পরিবর্তন করুন` : `${label} আপলোড করুন`}
        onKeyDown={handleBoxKeyDown}
        style={{
          // Roughly the 30mm x 35mm passport-photo aspect ratio, scaled
          // up for a comfortable on-screen click target.
          width: 140, height: 165,
          border: `1.5px dashed ${dragOver ? '#2563EB' : '#CBD5E1'}`,
          borderRadius: 8, background: dragOver ? '#EFF6FF' : '#F8FAFC',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', overflow: 'hidden', position: 'relative',
        }}
      >
        {value ? (
          <img src={value} alt="কর্মীর ছবি" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', padding: 8, lineHeight: 1.4 }}>
            ছবি আপলোড করতে<br />ক্লিক করুন বা টেনে আনুন
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={openPicker}
          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer', color: '#374151' }}
        >
          {value ? 'পরিবর্তন করুন' : 'আপলোড করুন'}
        </button>
        <button
          type="button"
          onClick={openCamera}
          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #BFDBFE', background: '#EFF6FF', cursor: 'pointer', color: '#1E40AF' }}
        >
          ছবি তুলুন
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #FECACA', background: '#fff', cursor: 'pointer', color: '#DC2626' }}
          >
            মুছুন
          </button>
        )}
      </div>

      {hint && !error && !cameraError && <span style={{ fontSize: 10, color: '#94A3B8' }}>{hint}</span>}
      {error && <span role="alert" style={{ fontSize: 10, color: '#DC2626' }}>{error}</span>}
      {cameraError && <span role="alert" style={{ fontSize: 10, color: '#DC2626' }}>{cameraError}</span>}

      {cameraOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="লাইভ ছবি তুলুন"
          style={{ position: 'fixed', inset: 0, zIndex: 9600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div onClick={stopCamera} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} aria-hidden="true" />
          <div style={{ position: 'relative', background: '#111827', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.35)' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              aria-label="লাইভ ক্যামেরা প্রিভিউ"
              style={{ width: 320, maxWidth: '80vw', borderRadius: 8, background: '#000' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={capturePhoto}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                ক্যাপচার
              </button>
              <button
                type="button"
                onClick={stopCamera}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,.35)', background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer' }}
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Display box (for print documents) ──────────────────────────────────────

interface PhotoDisplayBoxProps {
  /** Base64 data URL (or any image URL) — pass formData.photo here. */
  src?: string;
  alt?: string;
  /** Shown instead of the image when no photo is attached. Defaults to
   *  each caller's own placeholder text so existing layouts don't shift. */
  placeholderLabel?: React.ReactNode;
  /** Forwarded to the box div — reuse each document's own box class
   *  (e.g. "idc-photo-box") so its existing border/size/position CSS
   *  still applies; only the *contents* change here. */
  className?: string;
  style?: React.CSSProperties;
}

export const PhotoDisplayBox: React.FC<PhotoDisplayBoxProps> = ({
  src, alt = 'কর্মীর ছবি', placeholderLabel = 'ছবি', className, style,
}) => (
  <div
    className={className}
    style={{ ...style, overflow: 'hidden' }}
    // Mirrors each caller's previous aria-hidden-on-the-empty-box
    // behavior: hidden decorative placeholder when empty, a real
    // accessible image when a photo is actually attached.
    aria-hidden={src ? undefined : true}
  >
    {src ? (
      <img
        src={src}
        alt={alt}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    ) : (
      <span>{placeholderLabel}</span>
    )}
  </div>
);