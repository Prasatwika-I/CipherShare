import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { uploadFile } from '../../services/api';

/* ── Helpers ─────────────────────────────────────────────── */
function fileIcon(name = '') {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf')                            return { icon: '📕', color: '#dc2626', bg: '#fef2f2' };
  if (['doc','docx'].includes(ext))             return { icon: '📘', color: '#2563eb', bg: '#eff6ff' };
  if (['xls','xlsx','csv'].includes(ext))       return { icon: '📗', color: '#059669', bg: '#f0fdf4' };
  if (['ppt','pptx'].includes(ext))             return { icon: '📙', color: '#d97706', bg: '#fffbeb' };
  if (['jpg','jpeg','png','gif','svg','webp'].includes(ext)) return { icon: '🖼️', color: '#7c3aed', bg: '#f5f3ff' };
  if (['zip','rar','7z'].includes(ext))         return { icon: '📦', color: '#6b7280', bg: '#f9fafb' };
  if (['txt','md'].includes(ext))               return { icon: '📝', color: '#4f46e5', bg: '#eef2ff' };
  return { icon: '📄', color: '#6b7280', bg: '#f9fafb' };
}
function fmtSize(b = 0) {
  if (!b) return '—';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

const ALLOWED_TYPES = [
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
  'application/zip', 'application/x-zip-compressed',
  'text/plain', 'text/csv',
];

export default function UploadFile() {
  const [file, setFile]           = useState(null);
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState('');
  const [done, setDone]           = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) { setError('File exceeds 50 MB limit.'); return; }
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError(`File type "${f.type}" is not allowed. Use PDF, Word, Excel, PowerPoint, Images, ZIP, or TXT.`);
      return;
    }
    setFile(f); setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setProgress(0); setError('');
    const interval = setInterval(() => setProgress(p => Math.min(p + 10, 88)), 200);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await uploadFile(fd);
      clearInterval(interval);
      setProgress(100);
      setDone(true);
      // Navigate to My Files after a brief success pause
      setTimeout(() => navigate('/manager/my-files'), 1400);
    } catch (e) {
      clearInterval(interval);
      setError(e.response?.data?.error || 'Upload failed. Please try again.');
    } finally { setUploading(false); }
  };

  const fi = file ? fileIcon(file.name) : null;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content mgr-main">

        {/* Header */}
        <div className="mgr-page-header">
          <div>
            <h1 className="mgr-page-title">Upload File</h1>
            <p className="mgr-page-sub">Share documents securely with your team</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

          {/* Upload Card */}
          <div className="mgr-card">
            <h2 className="mgr-card-title" style={{ marginBottom: 4 }}>⬆️ Upload a File</h2>
            <p className="mgr-card-sub" style={{ marginBottom: 20 }}>Drag & drop or click to browse</p>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: '.85rem', marginBottom: 16, border: '1px solid #fecaca' }}>
                ❌ {error}
              </div>
            )}

            {done ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#059669', marginBottom: 8 }}>Upload Complete!</div>
                <div style={{ fontSize: '.875rem', color: 'var(--fg3)' }}>Redirecting to My Files…</div>
              </div>
            ) : !file ? (
              <div
                className={`mgr-upload-zone${dragging ? ' dragging' : ''}`}
                onClick={() => fileInputRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              >
                <div className="mgr-upload-icon">{dragging ? '📂' : '⬆️'}</div>
                <div className="mgr-upload-title">{dragging ? 'Drop it here!' : 'Drop files here or click to browse'}</div>
                <div className="mgr-upload-sub">PDF, Word, Excel, PowerPoint, Images, ZIP, TXT — Max 50 MB</div>
                <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.txt,.csv,.svg,.webp"
                  onChange={e => handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="mgr-file-preview">
                <div className="mgr-file-icon" style={{ background: fi.bg, color: fi.color, width: 50, height: 50, fontSize: '1.4rem' }}>
                  {fi.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--fg4)', marginTop: 3 }}>{fmtSize(file.size)} · {file.type || 'Unknown type'}</div>
                </div>
                {!uploading && (
                  <button onClick={() => { setFile(null); setProgress(0); }} style={{ border: 'none', background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: 'pointer', fontSize: '.8rem' }}>
                    ✕ Remove
                  </button>
                )}
              </div>
            )}

            {/* Progress Bar */}
            {uploading && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: 'var(--fg3)', marginBottom: 6 }}>
                  <span>Uploading…</span><span>{progress}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 100, background: '#e5e7eb', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 100,
                    background: 'linear-gradient(90deg,#4f46e5,#7c3aed)',
                    width: `${progress}%`, transition: 'width .2s ease',
                  }} />
                </div>
              </div>
            )}

            {!done && (
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="mgr-btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                  disabled={!file || uploading} onClick={handleUpload}>
                  {uploading ? '⏳ Uploading…' : '⬆️ Upload File'}
                </button>
                <button onClick={() => navigate('/manager/my-files')} style={{
                  padding: '9px 18px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)',
                  background: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '.875rem',
                }}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="mgr-card">
              <h3 style={{ fontSize: '.85rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 14 }}>🔒 Secure Upload</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['🔒', 'Stored securely in Firebase Storage'],
                  ['📋', 'Metadata saved in Firestore'],
                  ['🔗', 'Ready to share immediately'],
                  ['📊', 'Activity logged automatically'],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: '.82rem', color: 'var(--fg3)' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mgr-card">
              <h3 style={{ fontSize: '.85rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 12 }}>📎 Supported Formats</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  ['📕','PDF'],['📘','DOCX'],['📗','XLSX'],['📙','PPTX'],
                  ['🖼️','Images'],['📦','ZIP'],['📝','TXT / CSV'],
                ].map(([icon, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 100, background: 'var(--bg-soft2)', fontSize: '.75rem', fontWeight: 600, color: 'var(--fg2)' }}>
                    <span>{icon}</span><span>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: '.75rem', color: 'var(--fg4)' }}>Max file size: 50 MB</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
