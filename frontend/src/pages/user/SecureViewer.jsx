import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  getFileMetadata,
  logProtectionEvent,
  downloadFileUrl,
  recordDownload,
} from '../../services/api';

function fmtSize(b = 0) {
  if (!b) return '—';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

export default function SecureViewer() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [file, setFile] = useState(null);
  const [textCont, setTextCont] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blurred, setBlurred] = useState(false);
  const [warning, setWarning] = useState('');
  const warningTimer = useRef(null);

  const showWarning = (msg) => {
    clearTimeout(warningTimer.current);
    setWarning(msg);
    warningTimer.current = setTimeout(() => setWarning(''), 3500);
  };

  // Fetch metadata on mount
  useEffect(() => {
    setLoading(true);
    setError('');
    getFileMetadata(fileId)
      .then((res) => {
        setFile(res.data);
        // Log view event
        logProtectionEvent(fileId, 'VIEW').catch(() => {});

        // If it's a text or CSV file, fetch content to render securely inline
        const type = res.data.fileType || '';
        if (type.startsWith('text/') || type === 'application/json') {
          import('../../firebase/config').then(({ auth }) => {
            auth.currentUser?.getIdToken().then(token => {
              axios
                .get(`https://ciphershare-backend.onrender.com/api/file/download?fileId=${fileId}&mode=view&token=${token}`, { withCredentials: true })
                .then((contentRes) => {
                  const data = typeof contentRes.data === 'object'
                    ? JSON.stringify(contentRes.data, null, 2)
                    : contentRes.data;
                  setTextCont(data);
                })
                .catch(() => setTextCont('Failed to load text preview content.'));
            });
          });
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to load file preview.');
      })
      .finally(() => setLoading(false));
  }, [fileId]);

  const [secureUrl, setSecureUrl] = useState('');
  useEffect(() => {
    if (file) {
      import('../../firebase/config').then(({ auth }) => {
        auth.currentUser?.getIdToken().then(token => {
          setSecureUrl(`https://ciphershare-backend.onrender.com/api/file/download?fileId=${file.fileId}&token=${token}`);
        });
      });
    }
  }, [file]);

  const clearClipboardWithWarning = () => {
    const warningText = `[SECURE PREVIEW] Screenshots are restricted. Confidential document: ${file?.fileName || 'CipherShare Document'}.`;
    
    // Method 1: Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(warningText).catch(() => {});
      // Repeat at intervals to overwrite what the OS captured
      [50, 100, 200, 500, 1000].forEach((delay) => {
        setTimeout(() => {
          navigator.clipboard.writeText(warningText).catch(() => {});
        }, delay);
      });
    }

    // Method 2: execCommand fallback
    try {
      const el = document.createElement('textarea');
      el.value = warningText;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    } catch (err) {
      // silent
    }
  };

  const triggerScreenshotBlur = () => {
    // 1. Instant visual block by adding the class synchronously to the DOM
    const viewport = document.querySelector('.document-preview-viewport');
    if (viewport) {
      viewport.classList.add('blurred-content');
    }

    // 2. Set the state to blurred so React shows the overlay card
    setBlurred(true);

    // 3. Clear the clipboard immediately and at multiple intervals
    clearClipboardWithWarning();

    // 4. Log to backend activity log
    logProtectionEvent(fileId, 'SCREENSHOT').catch(() => {});

    // 5. Show toast warning
    showWarning('Screenshots are restricted.');
  };

  const handleResume = () => {
    const viewport = document.querySelector('.document-preview-viewport');
    if (viewport) {
      viewport.classList.remove('blurred-content');
    }
    setBlurred(false);
  };

  // Document protection event listeners
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      showWarning('Right-click is disabled for security reasons.');
    };

    const handleCopy = (e) => {
      e.preventDefault();
      showWarning('Copying text is disabled for security reasons.');
    };

    const handleKeyDown = (e) => {
      // Ctrl+P or Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        showWarning('Printing is disabled for security reasons.');
      }
      // Ctrl+C or Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        showWarning('Copying is disabled for security reasons.');
      }
      
      // Screenshot keys / combinations
      const isPrintScreen = e.key === 'PrintScreen' || e.key === 'Snapshot' || e.keyCode === 44 || e.code === 'PrintScreen';
      const isWinShiftS = (e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S' || e.keyCode === 83);
      const isMacCmdShift = (e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === '3' || e.key === '4' || e.keyCode === 51 || e.keyCode === 52);

      if (isPrintScreen || isWinShiftS || isMacCmdShift) {
        e.preventDefault();
        triggerScreenshotBlur();
      }
    };

    const handleKeyUp = (e) => {
      const isPrintScreen = e.key === 'PrintScreen' || e.key === 'Snapshot' || e.keyCode === 44 || e.code === 'PrintScreen';
      const isWinShiftS = (e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S' || e.keyCode === 83);
      const isMacCmdShift = (e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === '3' || e.key === '4' || e.keyCode === 51 || e.keyCode === 52);

      if (isPrintScreen || isWinShiftS || isMacCmdShift) {
        e.preventDefault();
        triggerScreenshotBlur();
      }
    };

    // Tab blur/focus detection
    const handleFocus = () => {
      // Note: We don't auto-unblur here to force the user to click "Resume"
    };

    const handleBlur = () => {
      const viewport = document.querySelector('.document-preview-viewport');
      if (viewport) {
        viewport.classList.add('blurred-content');
      }
      setBlurred(true);
      logProtectionEvent(fileId, 'TAB_BLUR').catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const viewport = document.querySelector('.document-preview-viewport');
        if (viewport) {
          viewport.classList.add('blurred-content');
        }
        setBlurred(true);
        logProtectionEvent(fileId, 'TAB_BLUR').catch(() => {});
      }
    };

    // Attach listeners
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Cleanup
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(warningTimer.current);
    };
  }, [fileId, file]);

  const handleDownload = async () => {
    if (!file?.fileId) return;
    try {
      await recordDownload(file.fileId);
    } catch {
      /* silent */
    }
  };

  // Watermark SVG Generator
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const userEmail = user?.email || 'unknown@user.com';
  const watermarkSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="380" height="280">
      <text x="30" y="160" fill="rgba(99, 102, 241, 0.08)" font-family="Inter, sans-serif" font-size="11" font-weight="700" transform="rotate(-30 190 140)">
        CipherShare Confidential
      </text>
      <text x="30" y="180" fill="rgba(99, 102, 241, 0.08)" font-family="Inter, sans-serif" font-size="9" transform="rotate(-30 190 140)">
        User: ${userEmail}
      </text>
      <text x="30" y="195" fill="rgba(99, 102, 241, 0.08)" font-family="Inter, sans-serif" font-size="9" transform="rotate(-30 190 140)">
        Date: ${today}
      </text>
      <text x="30" y="210" fill="rgba(99, 102, 241, 0.08)" font-family="Inter, sans-serif" font-size="9" transform="rotate(-30 190 140)">
        ----------------------------------
      </text>
    </svg>
  `;
  const watermarkUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(watermarkSvg)}")`;

  if (loading) {
    return (
      <div className="protected-viewer-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-spinner" />
        <p style={{ marginTop: 16, color: 'var(--fg3)', fontWeight: 600 }}>Loading Secure Document Viewer...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="protected-viewer-container" style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', padding: 32, borderRadius: 'var(--r-md)', textAlign: 'center', maxWidth: 450 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🚫</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 8 }}>Access Restricted</h2>
          <p style={{ fontSize: '0.875rem', color: '#ef4444', marginBottom: 20 }}>{error}</p>
          <button className="mgr-btn-outline" style={{ width: '100%' }} onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const fileType = file?.fileType || '';
  const isImage = fileType.startsWith('image/');
  const isText = fileType.startsWith('text/') || fileType === 'application/json';
  const isPdf = fileType === 'application/pdf';

  return (
    <div className="protected-viewer-container">
      {/* ── SECURITY BANNER ── */}
      <div className="confidential-banner">
        🛡️ Confidential Document — Unauthorized capture, print, or distribution is strictly prohibited.
      </div>

      {/* ── HEADER BAR ── */}
      <header className="viewer-header">
        <div className="viewer-title-wrap">
          <button
            onClick={() => navigate(-1)}
            className="back-btn"
            style={{ position: 'static', padding: '8px 16px', border: '1px solid var(--border)', boxShadow: 'none' }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
          <div style={{ borderLeft: '1px solid var(--border)', height: 20, margin: '0 8px' }} />
          <div>
            <h1 className="viewer-title">{file?.fileName}</h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--fg4)', marginTop: 2 }}>
              Size: {fmtSize(file?.fileSize)} · Owner: {file?.ownerName}
            </p>
          </div>
        </div>

        <div className="viewer-actions">
          {file?.canDownload ? (
            <a
              href={secureUrl ? secureUrl + '&mode=download' : '#'}
              download={file.fileName}
              onClick={handleDownload}
              className="mgr-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', padding: '8px 18px', fontSize: '.8rem' }}
            >
              ⬇️ Download File
            </a>
          ) : (
            <button
              className="mgr-btn-outline"
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', fontSize: '.8rem' }}
            >
              🔒 Download Locked
            </button>
          )}
        </div>
      </header>

      {/* ── SECURITY TOAST ALERT ── */}
      {warning && (
        <div className="security-toast">
          <span>⚠️</span> {warning}
        </div>
      )}

      {/* ── CONTENT AREA ── */}
      <div className="viewer-content-wrapper">
        {/* Dynamic Watermark Layer */}
        <div className="watermark-overlay" style={{ backgroundImage: watermarkUrl }} />

        {/* Tab Switch Blur Overlay */}
        {blurred && (
          <div className="blur-warning-overlay" onClick={handleResume}>
            <div className="blur-warning-card">
              <div className="blur-warning-icon">🔒</div>
              <h3 className="blur-warning-title">Protected Content Hidden</h3>
              <p className="blur-warning-desc">
                Document visibility was suspended because the window lost focus. Click inside this card to resume viewing.
              </p>
            </div>
          </div>
        )}

        {/* Document Preview Viewport */}
        <div className={`document-preview-viewport${blurred ? ' blurred-content' : ''}`}>
          {isImage ? (
            <img
              src={secureUrl ? secureUrl + '&mode=view' : ''}
              alt={file.fileName}
              className="protected-image-preview"
              onDragStart={(e) => e.preventDefault()}
            />
          ) : isText ? (
            <pre className="protected-text-preview">{textCont}</pre>
          ) : isPdf ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* Cover transparent overlay to catch click events and block selection/printing inside PDF iframe */}
              <div className="iframe-secure-overlay" />
              <iframe
                src={secureUrl ? secureUrl + '&mode=view#toolbar=0&navpanes=0' : ''}
                title="PDF Preview"
                width="100%"
                height="100%"
                style={{ border: 'none', background: '#fff' }}
              />
            </div>
          ) : (
            /* Unrenderable File Type Secure Card */
            <div style={{ padding: 40, textAlign: 'center', maxWidth: 450 }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>📦</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 8 }}>
                Secure Document Preview
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--fg3)', lineHeight: 1.5, marginBottom: 20 }}>
                This file type ({fileType.split('/')[1]?.toUpperCase() || 'Binary'}) cannot be displayed inline. Contact the file owner to request download access if restricted.
              </p>
              {file?.canDownload && (
                <a
                  href={secureUrl ? secureUrl + '&mode=download' : '#'}
                  download={file.fileName}
                  onClick={handleDownload}
                  className="mgr-btn-primary"
                  style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                  Download File
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
