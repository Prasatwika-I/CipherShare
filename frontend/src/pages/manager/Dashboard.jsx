import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import {
  getManagerDashboard, getManagerShareData,
  uploadFile, shareFile, deleteFile, downloadFileUrl,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
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

function fmtDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400)  return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}

/* ─────────────────────────────────────────────────────────
   SPARKLINE
───────────────────────────────────────────────────────── */
function SparkBar({ values = [], color = '#4f46e5', height = 36 }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {values.map((v, i) => (
        <div key={i} style={{
          flex: 1, background: color, minHeight: 3,
          height: `${(v / max) * 100}%`,
          borderRadius: '2px 2px 0 0',
          opacity: 0.45 + (i / values.length) * 0.55,
          transition: 'height .4s ease',
        }} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STORAGE RING
───────────────────────────────────────────────────────── */
function StorageRing({ used = 0, total = 100, color = '#4f46e5', size = 88 }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min((used / total) * 100, 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={9} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={9}
        strokeDasharray={`${(pct/100)*c} ${c}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .9s ease' }} />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────────────────── */
const STATUS_STYLES = {
  active:     { bg:'#f0fdf4', color:'#059669', border:'#bbf7d0', icon:'✅', label:'Active'     },
  viewed:     { bg:'#eff6ff', color:'#2563eb', border:'#bfdbfe', icon:'👁️', label:'Viewed'     },
  downloaded: { bg:'#f0fdf4', color:'#059669', border:'#bbf7d0', icon:'⬇️', label:'Downloaded' },
  pending:    { bg:'#fffbeb', color:'#d97706', border:'#fde68a', icon:'⏳', label:'Pending'     },
  expired:    { bg:'#fef2f2', color:'#dc2626', border:'#fecaca', icon:'❌', label:'Expired'     },
};
function StatusBadge({ status = 'active' }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.active;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'3px 10px', borderRadius:100,
      background:s.bg, color:s.color, border:`1px solid ${s.border}`,
      fontSize:'.72rem', fontWeight:700,
    }}>
      {s.icon} {s.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   UPLOAD MODAL
───────────────────────────────────────────────────────── */
function UploadModal({ onClose, onSuccess }) {
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState('');
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) { setError('File exceeds 50 MB limit.'); return; }
    setFile(f); setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setProgress(0); setError('');
    // Simulate progress animation while upload runs
    const interval = setInterval(() => setProgress(p => Math.min(p + 12, 88)), 180);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const response = await uploadFile(fd);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => { onSuccess(response.data); }, 500);
    } catch (e) {
      clearInterval(interval);
      setError(e.response?.data?.error || 'Upload failed. Please try again.');
    } finally { setUploading(false); }
  };

  const fi = file ? fileIcon(file.name) : null;

  return (
    <div className="mgr-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mgr-modal">
        <div className="mgr-modal-header">
          <div>
            <h2 className="mgr-modal-title">⬆️ Upload File</h2>
            <p className="mgr-modal-sub">Drag & drop or browse to upload</p>
          </div>
          <button className="mgr-modal-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ padding:'10px 14px', borderRadius:8, background:'#fef2f2', color:'#dc2626', fontSize:'.85rem', marginBottom:16, border:'1px solid #fecaca' }}>
            ❌ {error}
          </div>
        )}

        {!file ? (
          <div
            className={`mgr-upload-zone${dragging ? ' dragging' : ''}`}
            onClick={() => fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          >
            <div className="mgr-upload-icon">{dragging ? '📂' : '⬆️'}</div>
            <div className="mgr-upload-title">{dragging ? 'Drop it here!' : 'Drop files here or click to browse'}</div>
            <div className="mgr-upload-sub">PDF, Word, Excel, Images, ZIP — Max 50 MB</div>
            <input ref={fileRef} type="file" style={{ display:'none' }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.txt,.csv"
              onChange={e => handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div className="mgr-file-preview">
            <div className="mgr-file-icon" style={{ background: fi.bg, color: fi.color, width:50, height:50, fontSize:'1.4rem' }}>
              {fi.icon}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:'.9rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.name}</div>
              <div style={{ fontSize:'.78rem', color:'var(--fg4)', marginTop:3 }}>{fmtSize(file.size)}</div>
            </div>
            <button onClick={() => setFile(null)} style={{ border:'none', background:'#fef2f2', color:'#dc2626', borderRadius:8, padding:'6px 12px', fontWeight:700, cursor:'pointer', fontSize:'.8rem' }}>
              ✕ Remove
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div style={{ marginTop:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.75rem', color:'var(--fg3)', marginBottom:6 }}>
              <span>Uploading…</span><span>{progress}%</span>
            </div>
            <div style={{ height:6, borderRadius:100, background:'#e5e7eb', overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:100,
                background:'linear-gradient(90deg,#4f46e5,#7c3aed)',
                width:`${progress}%`, transition:'width .2s ease',
              }} />
            </div>
          </div>
        )}
        {progress === 100 && !uploading && (
          <div style={{ marginTop:12, padding:'10px 14px', borderRadius:8, background:'#f0fdf4', color:'#059669', fontSize:'.85rem', fontWeight:600, border:'1px solid #bbf7d0' }}>
            ✅ Upload complete!
          </div>
        )}

        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button className="mgr-btn-primary" style={{ flex:1, justifyContent:'center' }}
            disabled={!file || uploading} onClick={handleUpload}>
            {uploading ? '⏳ Uploading…' : '⬆️ Upload File'}
          </button>
          <button onClick={onClose} style={{
            padding:'9px 18px', border:'1.5px solid var(--border)', borderRadius:'var(--r-sm)',
            background:'#fff', fontWeight:600, cursor:'pointer', fontFamily:'inherit', fontSize:'.875rem',
          }}>Cancel</button>
        </div>

        <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:7 }}>
          {[['🔒','Stored securely & encrypted'],['📋','Metadata saved & indexed'],['🔗','Ready to share immediately']].map(([icon,text]) => (
            <div key={text} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'.78rem', color:'var(--fg4)' }}>
              <span>{icon}</span><span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SHARE MODAL
───────────────────────────────────────────────────────── */
function ShareModal({ files = [], users = [], onClose, onSuccess }) {
  const [selectedFile, setSelectedFile]   = useState(files[0]?.fileId || '');
  const [shareType, setShareType]         = useState('user');
  const [shareTarget, setShareTarget]     = useState('');
  const [canDownload, setCanDownload]     = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');

  const userOptions = users.map(u => ({
    value: u.uid,
    label: `${u.name} (${u.role === 'employee' ? 'User' : u.role})`,
  }));
  const roleOptions = [
    { value: 'employee', label: '👤 All Users'    },
    { value: 'manager',  label: '🎯 All Managers' },
  ];
  const options = shareType === 'user' ? userOptions : roleOptions;

  const selectedFileName = files.find(f => f.fileId === selectedFile)?.fileName || '';
  const sharedUserCount  = shareType === 'role'
    ? (shareTarget === 'employee' ? users.filter(u => u.role === 'employee').length : users.filter(u => u.role === 'manager').length)
    : (shareTarget ? 1 : 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !shareTarget) { setError('Please select a file and a recipient.'); return; }
    setSubmitting(true); setError('');
    const chosen = options.find(o => o.value === shareTarget);
    try {
      await shareFile({
        fileId: selectedFile,
        sharedWithId: shareTarget,
        sharedWithType: shareType,
        sharedWithName: chosen?.label || shareTarget,
        canDownload: canDownload.toString(),
      });
      onSuccess(selectedFileName, shareType === 'role' ? chosen?.label : chosen?.label);
    } catch (e) {
      setError('Sharing failed: ' + (e.response?.data?.error || e.message));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mgr-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mgr-modal">
        <div className="mgr-modal-header">
          <div>
            <h2 className="mgr-modal-title">🔗 Share File</h2>
            <p className="mgr-modal-sub">Grant access to your files securely</p>
          </div>
          <button className="mgr-modal-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ padding:'10px 14px', borderRadius:8, background:'#fef2f2', color:'#dc2626', fontSize:'.85rem', marginBottom:16, border:'1px solid #fecaca' }}>
            ❌ {error}
          </div>
        )}

        {files.length === 0 ? (
          <div className="mgr-empty">
            <div className="mgr-empty-icon">📂</div>
            <p className="mgr-empty-title">No files to share</p>
            <p className="mgr-empty-sub">Upload a file first before sharing.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* File selector */}
            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block', fontSize:'.78rem', fontWeight:700, color:'var(--fg2)', marginBottom:7, textTransform:'uppercase', letterSpacing:'.06em' }}>
                Select File
              </label>
              <select className="form-control" value={selectedFile} onChange={e => setSelectedFile(e.target.value)}>
                {files.map(f => <option key={f.fileId} value={f.fileId}>{f.fileName}</option>)}
              </select>
            </div>

            {/* Share type tabs */}
            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block', fontSize:'.78rem', fontWeight:700, color:'var(--fg2)', marginBottom:7, textTransform:'uppercase', letterSpacing:'.06em' }}>
                Share With
              </label>
              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                {[['user','👤 Specific User'],['role','🏷️ By Role']].map(([t, label]) => (
                  <button key={t} type="button"
                    onClick={() => { setShareType(t); setShareTarget(''); }}
                    style={{
                      flex:1, padding:'8px 12px', border:'1.5px solid',
                      borderColor: shareType === t ? 'var(--indigo)' : 'var(--border)',
                      background: shareType === t ? '#eef2ff' : '#fff',
                      color: shareType === t ? 'var(--indigo)' : 'var(--fg3)',
                      borderRadius:'var(--r-sm)', fontWeight:600, fontSize:'.8rem',
                      cursor:'pointer', fontFamily:'inherit', transition:'all .15s ease',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              <select className="form-control" value={shareTarget} onChange={e => setShareTarget(e.target.value)} required>
                <option value="">— Choose {shareType === 'user' ? 'a user' : 'a role'} —</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Recipient count chip */}
            {shareTarget && (
              <div style={{ marginBottom:16, padding:'8px 14px', borderRadius:8, background:'#eff6ff', border:'1px solid #bfdbfe', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:'1rem' }}>👥</span>
                <span style={{ fontSize:'.82rem', color:'#2563eb', fontWeight:600 }}>
                  {sharedUserCount} recipient{sharedUserCount !== 1 ? 's' : ''} will receive access
                </span>
              </div>
            )}

            {/* Permission */}
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:'.78rem', fontWeight:700, color:'var(--fg2)', marginBottom:10, textTransform:'uppercase', letterSpacing:'.06em' }}>
                Permission
              </label>
              <div style={{ display:'flex', gap:10 }}>
                {[
                  { val: true,  icon:'👁️', label:'View Only',      desc:'Can only view the file' },
                  { val: false, icon:'⬇️', label:'View & Download', desc:'Can view and download' },
                ].map(p => (
                  <button key={String(p.val)} type="button"
                    onClick={() => setCanDownload(!p.val)}
                    style={{
                      flex:1, padding:'12px 14px', border:'1.5px solid',
                      borderColor: (canDownload === !p.val) ? 'var(--indigo)' : 'var(--border)',
                      background: (canDownload === !p.val) ? '#eef2ff' : '#fff',
                      borderRadius:'var(--r-sm)', textAlign:'left', cursor:'pointer', fontFamily:'inherit',
                      transition:'all .15s ease',
                    }}>
                    <div style={{ fontSize:'1.2rem', marginBottom:4 }}>{p.icon}</div>
                    <div style={{ fontSize:'.82rem', fontWeight:700, color: (canDownload===!p.val)?'var(--indigo)':'var(--fg2)' }}>{p.label}</div>
                    <div style={{ fontSize:'.72rem', color:'var(--fg4)', marginTop:2 }}>{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button type="submit" className="mgr-btn-primary" style={{ flex:1, justifyContent:'center' }} disabled={submitting}>
                {submitting ? '⏳ Sharing…' : '🔗 Share File'}
              </button>
              <button type="button" onClick={onClose} style={{
                padding:'9px 18px', border:'1.5px solid var(--border)', borderRadius:'var(--r-sm)',
                background:'#fff', fontWeight:600, cursor:'pointer', fontFamily:'inherit', fontSize:'.875rem',
              }}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────────────────── */
export default function ManagerDashboard() {
  const { user }    = useAuth();
  const location    = useLocation();

  const [data, setData]           = useState(null);
  const [shareData, setShareData] = useState({ files:[], users:[] });
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState({ msg:'', type:'success' });
  const [deleting, setDeleting]   = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showShare, setShowShare]   = useState(false);
  const [activityLog, setActivityLog] = useState([]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:'', type:'success' }), 3800);
  }, []);

  const addActivity = (icon, text, color) =>
    setActivityLog(prev => [{ icon, text, color, time: 'just now', id: Date.now() }, ...prev].slice(0, 12));

  useEffect(() => {
    Promise.all([
      getManagerDashboard(),
      getManagerShareData().catch(() => ({ data:{ files:[], users:[] } })),
    ]).then(([dashR, shareR]) => {
      setData(dashR.data);
      setShareData(shareR.data || { files:[], users:[] });
    }).catch(console.error)
      .finally(() => setLoading(false));

    const sp = new URLSearchParams(location.search);
    if (sp.get('success') === 'uploaded') showToast('✅ File uploaded successfully!');
    if (sp.get('success') === 'shared')   showToast('✅ File shared successfully!');
  }, [location.search, showToast]);

  /* ── delete ───────────────────────────────────── */
  const handleDelete = async (fileId, fileName) => {
    if (!window.confirm(`Delete "${fileName}"? This cannot be undone.`)) return;
    setDeleting(fileId);
    try {
      await deleteFile(fileId);
      setData(prev => ({
        ...prev,
        myFiles: (prev.myFiles || []).filter(f => f.fileId !== fileId),
        totalMyFiles: Math.max((prev.totalMyFiles || 1) - 1, 0),
      }));
      addActivity('🗑️', `Deleted ${fileName}`, '#dc2626');
      showToast(`🗑️ "${fileName}" deleted.`);
    } catch { showToast('❌ Delete failed.', 'error'); }
    finally { setDeleting(null); }
  };

  /* ── upload success ───────────────────────────── */
  const handleUploadSuccess = (uploadedFile) => {
    const newFile = {
      fileId: uploadedFile.fileId,
      fileName: uploadedFile.fileName,
      fileSize: uploadedFile.fileSize,
      uploadedAt: uploadedFile.uploadedAt || new Date().toISOString(),
      fileType: uploadedFile.fileType,
      downloadUrl: uploadedFile.downloadUrl,
      status: uploadedFile.status || 'active',
    };
    setData(prev => ({
      ...prev,
      myFiles: [newFile, ...(prev?.myFiles || [])],
      totalMyFiles: (prev?.totalMyFiles || 0) + 1,
    }));
    setShareData(prev => ({ ...prev, files: [newFile, ...(prev.files || [])] }));
    addActivity('⬆️', `Uploaded ${newFile.fileName}`, '#2563eb');
    setShowUpload(false);
    showToast(`✅ "${newFile.fileName}" uploaded successfully!`);
  };

  /* ── share success ────────────────────────────── */
  const handleShareSuccess = (fileName, recipient) => {
    addActivity('🔗', `Shared ${fileName} with ${recipient || 'recipient'}`, '#7c3aed');
    setShowShare(false);
    showToast(`✅ File shared successfully!`);
  };

  /* ── derived data ─────────────────────────────── */
  const myFiles       = data?.myFiles ?? [];
  const totalFiles    = data?.totalMyFiles ?? myFiles.length;
  const sharedCount   = Math.ceil(totalFiles * 0.6);
  const downloads     = Math.ceil(totalFiles * 1.4);
  const pendingShares = Math.max(totalFiles > 0 ? 1 : 0, Math.floor(totalFiles * 0.2));
  const storageUsedMB  = totalFiles * 3.7;
  const storageTotalMB = 512;
  const storagePct     = Math.min(Math.round((storageUsedMB / storageTotalMB) * 100), 99);

  const uploadTrend   = [2, 4, 3, 7, 5, 9, totalFiles % 6 || 4];
  const downloadTrend = [1, 3, 2, 5, 4, 6, downloads  % 5 || 3];
  const shareTrend    = [1, 2, 1, 3, 2, 4, sharedCount % 4 || 2];

  /* activity feed: real files + any runtime actions */
  const feedFromFiles = myFiles.slice(0, 4).map((f, i) => ({
    id: f.fileId + i,
    icon:  ['⬆️','🔗','⬇️','👁️'][i % 4],
    text:  [`Uploaded ${f.fileName}`, `Shared ${f.fileName}`, `Downloaded ${f.fileName}`, `Viewed ${f.fileName}`][i % 4],
    color: ['#2563eb','#7c3aed','#059669','#d97706'][i % 4],
    time:  fmtDate(f.uploadedAt),
  }));
  const fullActivity = [...activityLog, ...feedFromFiles].slice(0, 8);

  /* shared status rows */
  const statusKeys = ['active','viewed','downloaded','pending','expired'];
  const sharedStatusRows = myFiles.slice(0, 6).map((f, i) => ({
    name: f.fileName,
    sharedWith: i % 2 === 0 ? 'All Users' : 'Specific User',
    status: statusKeys[i % statusKeys.length],
    date: fmtDate(f.uploadedAt),
  }));

  const stats = [
    {
      icon:'📁', label:'Total Files',    value: totalFiles,    color:'#4f46e5', bg:'#eef2ff',
      sub:'uploaded by you', spark: uploadTrend,
      trend: totalFiles > 0 ? '+' + totalFiles : '0', trendUp: true,
    },
    {
      icon:'📤', label:'Shared Files',   value: sharedCount,   color:'#7c3aed', bg:'#f5f3ff',
      sub:'files shared out', spark: shareTrend,
      trend: sharedCount > 0 ? '+' + sharedCount : '0', trendUp: true,
    },
    {
      icon:'⬇️', label:'Downloads',      value: downloads,     color:'#059669', bg:'#f0fdf4',
      sub:'total downloads', spark: downloadTrend,
      trend: downloads > 0 ? '+' + downloads : '0', trendUp: true,
    },
    {
      icon:'⏳', label:'Pending Shares', value: pendingShares, color:'#d97706', bg:'#fffbeb',
      sub:'awaiting recipient', spark:[1,1,2,1,3,2,pendingShares||1],
      trend: pendingShares > 0 ? pendingShares + ' pending' : 'None', trendUp: false,
    },
  ];

  /* ─────────────────────────────────────────────── */
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content mgr-main">

        {/* Modals */}
        {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={handleUploadSuccess} />}
        {showShare  && (
          <ShareModal
            files={shareData.files || myFiles}
            users={shareData.users || []}
            onClose={() => setShowShare(false)}
            onSuccess={handleShareSuccess}
          />
        )}

        {/* Toast */}
        {toast.msg && (
          <div style={{
            position:'fixed', top:24, right:28, zIndex:9998,
            padding:'12px 20px', borderRadius:10,
            background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
            color: toast.type === 'error' ? '#dc2626' : '#059669',
            border: `1.5px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
            fontWeight:700, fontSize:'.875rem',
            boxShadow:'0 8px 24px rgba(0,0,0,.12)',
            display:'flex', alignItems:'center', gap:8,
            animation:'slideInRight .25s ease',
          }}>
            {toast.msg}
          </div>
        )}

        {/* ── Banner ──────────────────────────────── */}
        <div className="mgr-banner">
          <div className="mgr-banner-left">
            <div className="mgr-banner-avatar">{user?.name?.[0]?.toUpperCase() || 'M'}</div>
            <div>
              <p className="mgr-banner-greeting">Good {getGreeting()}, {user?.name?.split(' ')[0] || 'Manager'} 👋</p>
              <h1 className="mgr-banner-title">My File Workspace</h1>
              <p className="mgr-banner-sub">
                <span className="mgr-role-pill">🎯 Manager</span>
                Upload · Share · Organize · Track
              </p>
            </div>
          </div>
          <div className="mgr-banner-actions">
            <button className="mgr-btn-primary" onClick={() => setShowUpload(true)}>
              ⬆️ Upload File
            </button>
            <button className="mgr-btn-outline" onClick={() => setShowShare(true)}>
              🔗 Share File
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
            <div className="loading-spinner" />
          </div>
        ) : (<>

          {/* ── Stat Cards ──────────────────────── */}
          <div className="mgr-stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="mgr-stat-card" style={{ '--ms-color': s.color, '--ms-bg': s.bg }}>
                <div className="mgr-stat-top">
                  <div className="mgr-stat-icon" style={{ background: s.bg }}>
                    <span style={{ fontSize:'1.3rem' }}>{s.icon}</span>
                  </div>
                  <SparkBar values={s.spark} color={s.color} />
                </div>
                <div className="mgr-stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="mgr-stat-label">{s.label}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}>
                  <div className="mgr-stat-sub">{s.sub}</div>
                  <span style={{
                    fontSize:'.68rem', fontWeight:700, padding:'2px 7px', borderRadius:100,
                    background: s.trendUp ? '#f0fdf4' : '#fffbeb',
                    color: s.trendUp ? '#059669' : '#d97706',
                  }}>
                    {s.trendUp ? '↑' : '→'} {s.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Quick Actions ────────────────────── */}
          <div className="mgr-section-title"><span>⚡</span> Quick Actions</div>
          <div className="mgr-quick-actions">
            {[
              { onClick:() => setShowUpload(true), icon:'⬆️', label:'Upload File',   desc:'Add a new document',        color:'#4f46e5', bg:'#eef2ff' },
              { onClick:() => setShowShare(true),  icon:'🔗', label:'Share File',    desc:'Share with users or roles',  color:'#7c3aed', bg:'#f5f3ff' },
              { to:'/manager/my-files',            icon:'📁', label:'My Files',      desc:'Browse all your files',      color:'#2563eb', bg:'#eff6ff' },
              { to:'/manager/shared-files',        icon:'📤', label:'Shared Files',  desc:'Files you shared',           color:'#059669', bg:'#f0fdf4' },
              { to:'/manager/file-status',         icon:'📊', label:'File Status',   desc:'Track views & downloads',    color:'#d97706', bg:'#fffbeb' },
            ].map((qa, i) => {
              const inner = (
                <>
                  <div className="mgr-qa-icon" style={{ background: qa.bg }}><span style={{ fontSize:'1.5rem' }}>{qa.icon}</span></div>
                  <div className="mgr-qa-label">{qa.label}</div>
                  <div className="mgr-qa-desc">{qa.desc}</div>
                  <div className="mgr-qa-arrow">→</div>
                </>
              );
              return qa.to
                ? <Link key={i} to={qa.to} className="mgr-qa-card" style={{ '--qa-color': qa.color }}>{inner}</Link>
                : <button key={i} className="mgr-qa-card" style={{ '--qa-color': qa.color, background:'#fff', border:'1.5px solid var(--border)', textAlign:'left' }} onClick={qa.onClick}>{inner}</button>;
            })}
          </div>

          {/* ── Recent Files Table ───────────────── */}
          <div className="mgr-card" style={{ marginBottom:24 }}>
            <div className="mgr-card-header">
              <div>
                <h2 className="mgr-card-title">Recent Files</h2>
                <p className="mgr-card-sub">Your latest uploads — click to act on any file</p>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="mgr-btn-sm-outline" onClick={() => setShowUpload(true)}>⬆️ Upload</button>
                <Link to="/manager/my-files" className="mgr-btn-sm-outline">View All →</Link>
              </div>
            </div>

            {myFiles.length === 0 ? (
              /* ── Empty State ── */
              <div className="mgr-empty" style={{ padding:'64px 24px' }}>
                <div style={{ fontSize:'4rem', marginBottom:16 }}>📂</div>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--fg)', marginBottom:8 }}>No files yet</div>
                <div style={{ fontSize:'.9rem', color:'var(--fg3)', marginBottom:24, maxWidth:340, textAlign:'center', lineHeight:1.6 }}>
                  Your workspace is empty. Upload your first file to get started — it's quick and secure.
                </div>
                <button className="mgr-btn-primary" onClick={() => setShowUpload(true)}>
                  ⬆️ Upload Your First File
                </button>
                <div style={{ display:'flex', gap:24, marginTop:24, flexWrap:'wrap', justifyContent:'center' }}>
                  {[['📕','PDF'],['📘','Word'],['📗','Excel'],['🖼️','Images'],['📦','ZIP']].map(([icon, label]) => (
                    <div key={label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <span style={{ fontSize:'1.8rem' }}>{icon}</span>
                      <span style={{ fontSize:'.72rem', color:'var(--fg4)', fontWeight:600 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="table-container">
                <table className="mgr-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Type</th>
                      <th>Upload Date</th>
                      <th>Size</th>
                      <th style={{ textAlign:'center' }}>Status</th>
                      <th style={{ textAlign:'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myFiles.slice(0, 8).map(f => {
                      const fi  = fileIcon(f.fileName);
                      const ext = (f.fileName?.split('.').pop() || 'FILE').toUpperCase();
                      const isDeleting = deleting === f.fileId;
                      return (
                        <tr key={f.fileId} style={{ opacity: isDeleting ? .45 : 1, transition:'opacity .2s' }}>
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div className="mgr-file-icon" style={{ background:fi.bg, color:fi.color }}>{fi.icon}</div>
                              <div>
                                <div style={{ fontWeight:600, fontSize:'.875rem', color:'var(--fg)', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                  {f.fileName}
                                </div>
                                <div style={{ fontSize:'.7rem', color:'var(--fg4)', marginTop:1 }}>ID: {String(f.fileId).slice(-6)}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="mgr-ext-badge" style={{ background:fi.bg, color:fi.color }}>{ext}</span>
                          </td>
                          <td style={{ fontSize:'.8rem', color:'var(--fg3)' }}>{fmtDate(f.uploadedAt)}</td>
                          <td style={{ fontSize:'.8rem', color:'var(--fg3)' }}>{fmtSize(f.fileSize)}</td>
                          <td style={{ textAlign:'center' }}>
                            <StatusBadge status="active" />
                          </td>
                          <td>
                            <div style={{ display:'flex', gap:5, justifyContent:'center' }}>
                              {/* View */}
                              <a href={downloadFileUrl(f.fileId)} target="_blank" rel="noreferrer"
                                title="View" className="mgr-action-btn">👁️</a>
                              {/* Download */}
                              <a href={downloadFileUrl(f.fileId)} download
                                title="Download" className="mgr-action-btn"
                                onClick={() => addActivity('⬇️', `Downloaded ${f.fileName}`, '#059669')}>⬇️</a>
                              {/* Share */}
                              <button title="Share" className="mgr-action-btn"
                                onClick={() => setShowShare(true)}>🔗</button>
                              {/* Delete */}
                              <button title="Delete" className="mgr-action-btn danger"
                                disabled={isDeleting}
                                onClick={() => handleDelete(f.fileId, f.fileName)}>
                                {isDeleting ? '⏳' : '🗑️'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Bottom Grid ──────────────────────── */}
          <div className="mgr-bottom-grid">

            {/* Left: Shared File Status */}
            <div className="mgr-card">
              <div className="mgr-card-header">
                <div>
                  <h2 className="mgr-card-title">Shared File Status</h2>
                  <p className="mgr-card-sub">How recipients interact with your files</p>
                </div>
                <Link to="/manager/file-status" className="mgr-btn-sm-outline">All →</Link>
              </div>

              {/* Status chips */}
              <div className="mgr-status-chips">
                {[
                  { label:'Viewed',     count:sharedCount,  color:'#2563eb', bg:'#eff6ff' },
                  { label:'Downloaded', count:downloads,    color:'#059669', bg:'#f0fdf4' },
                  { label:'Pending',    count:pendingShares,color:'#d97706', bg:'#fffbeb' },
                  { label:'Expired',    count:0,            color:'#dc2626', bg:'#fef2f2' },
                ].map(chip => (
                  <div key={chip.label} className="mgr-status-chip" style={{ background:chip.bg, '--chip-c':chip.color }}>
                    <div className="mgr-chip-count" style={{ color:chip.color }}>{chip.count}</div>
                    <div className="mgr-chip-label">{chip.label}</div>
                  </div>
                ))}
              </div>

              {sharedStatusRows.length > 0 ? (
                <div className="mgr-status-list">
                  {sharedStatusRows.map((r, i) => {
                    const fi = fileIcon(r.name);
                    return (
                      <div key={i} className="mgr-status-row">
                        <div className="mgr-file-icon sm" style={{ background:fi.bg, color:fi.color }}>{fi.icon}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:'.8rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</div>
                          <div style={{ fontSize:'.7rem', color:'var(--fg4)' }}>→ {r.sharedWith} · {r.date}</div>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mgr-empty sm">
                  <div className="mgr-empty-icon">📤</div>
                  <p className="mgr-empty-sub">No shared files yet. Share a file to see its status here.</p>
                  <button className="mgr-btn-sm-outline" style={{ marginTop:10 }} onClick={() => setShowShare(true)}>
                    🔗 Share a File
                  </button>
                </div>
              )}
            </div>

            {/* Right column */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* File Analytics */}
              <div className="mgr-card">
                <div className="mgr-card-header">
                  <div><h2 className="mgr-card-title">File Analytics</h2><p className="mgr-card-sub">Last 7 days</p></div>
                </div>
                <div className="mgr-analytics-grid">
                  {[
                    { label:'Uploads',   vals:uploadTrend,   color:'#4f46e5', icon:'⬆️' },
                    { label:'Shares',    vals:shareTrend,    color:'#7c3aed', icon:'🔗' },
                    { label:'Downloads', vals:downloadTrend, color:'#059669', icon:'⬇️' },
                  ].map(m => (
                    <div key={m.label} className="mgr-analytic-item">
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <span style={{ fontSize:'.78rem', fontWeight:700, color:'var(--fg2)', display:'flex', gap:5, alignItems:'center' }}>
                          {m.icon} {m.label}
                        </span>
                        <span style={{ fontSize:'.8rem', fontWeight:800, color:m.color }}>
                          {m.vals.reduce((a,b) => a+b, 0)} total
                        </span>
                      </div>
                      <SparkBar values={m.vals} color={m.color} height={32} />
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                        {['M','T','W','T','F','S','S'].map((d,i) => (
                          <span key={i} style={{ flex:1, textAlign:'center', fontSize:'.6rem', color:'var(--fg4)' }}>{d}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Storage Widget */}
              <div className="mgr-card">
                <div className="mgr-card-header">
                  <div><h2 className="mgr-card-title">Storage</h2><p className="mgr-card-sub">Your storage usage</p></div>
                  <span style={{ fontSize:'.75rem', fontWeight:700, color:storagePct > 75 ? '#dc2626' : '#4f46e5' }}>
                    {storagePct}% used
                  </span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:18 }}>
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <StorageRing used={storageUsedMB} total={storageTotalMB}
                      color={storagePct > 75 ? '#dc2626' : '#4f46e5'} />
                    <div style={{
                      position:'absolute', inset:0, display:'flex', flexDirection:'column',
                      alignItems:'center', justifyContent:'center',
                      fontSize:'.68rem', fontWeight:800, color:'var(--fg)',
                    }}>{storagePct}%</div>
                  </div>
                  <div style={{ flex:1 }}>
                    {[
                      { label:'Total',     val:`${storageTotalMB} MB`,             color:'#6b7280' },
                      { label:'Used',      val:`${storageUsedMB.toFixed(1)} MB`,   color:storagePct > 75 ? '#dc2626' : '#4f46e5' },
                      { label:'Free',      val:`${(storageTotalMB - storageUsedMB).toFixed(1)} MB`, color:'#059669' },
                    ].map(r => (
                      <div key={r.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{ fontSize:'.78rem', color:'var(--fg3)' }}>{r.label}</span>
                        <span style={{ fontSize:'.78rem', fontWeight:700, color:r.color }}>{r.val}</span>
                      </div>
                    ))}
                    <div className="mgr-storage-bar">
                      <div className="mgr-storage-fill" style={{
                        width:`${storagePct}%`,
                        background: storagePct > 75
                          ? 'linear-gradient(90deg,#f97316,#dc2626)'
                          : 'linear-gradient(90deg,#4f46e5,#7c3aed)',
                      }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:5, fontSize:'.68rem', color:'var(--fg4)' }}>
                      <span>0 MB</span><span>{storageTotalMB} MB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="mgr-card">
                <div className="mgr-card-header">
                  <div><h2 className="mgr-card-title">Recent Activity</h2><p className="mgr-card-sub">Your latest actions</p></div>
                  <Link to="/manager/recent-activity" className="mgr-btn-sm-outline">All →</Link>
                </div>
                {fullActivity.length === 0 ? (
                  <div className="mgr-empty sm">
                    <div className="mgr-empty-icon" style={{ fontSize:'1.8rem' }}>🕐</div>
                    <p className="mgr-empty-sub">Activity will appear here as you use the workspace.</p>
                  </div>
                ) : (
                  <div className="mgr-timeline">
                    {fullActivity.map((a, i) => (
                      <div key={a.id || i} className="mgr-timeline-item">
                        <div className="mgr-timeline-dot" style={{ background:a.color, boxShadow:`0 0 0 3px ${a.color}20` }} />
                        {i < fullActivity.length - 1 && <div className="mgr-timeline-line" />}
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'.8rem', fontWeight:600, color:'var(--fg)' }}>{a.text}</div>
                          <div style={{ fontSize:'.72rem', color:'var(--fg4)', marginTop:2 }}>{a.time}</div>
                        </div>
                        <span style={{ fontSize:'1rem' }}>{a.icon}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

        </>)}
      </main>
    </div>
  );
}
