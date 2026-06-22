import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Alert from '../../components/Alert';
import { getAdminFiles, deleteFile, downloadFileUrl } from '../../services/api';

function fileIcon(type) {
  if (!type) return '📄';
  if (type.includes('pdf'))    return '📕';
  if (type.includes('word'))   return '📘';
  if (type.includes('excel') || type.includes('spreadsheet')) return '📗';
  if (type.includes('powerpoint') || type.includes('presentation')) return '📙';
  if (type.includes('image'))  return '🖼️';
  if (type.includes('zip'))    return '📦';
  if (type.includes('text'))   return '📝';
  return '📄';
}

function fmtSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024)    return bytes + ' B';
  if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1048576).toFixed(1) + ' MB';
}

function typeLabel(type) {
  if (!type) return 'Unknown';
  if (type.includes('pdf'))   return 'PDF';
  if (type.includes('word'))  return 'Word';
  if (type.includes('excel') || type.includes('spreadsheet')) return 'Excel';
  if (type.includes('image')) return 'Image';
  if (type.includes('zip'))   return 'Archive';
  if (type.includes('text'))  return 'Text';
  return 'File';
}

export default function ManageFiles() {
  const [files, setFiles]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [alert, setAlert]         = useState(null);
  const [selected, setSelected]   = useState(new Set());
  const [sortBy, setSortBy]       = useState('date');

  useEffect(() => {
    getAdminFiles()
      .then(r => setFiles(r.data.files || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (fileId) => {
    if (!window.confirm('Permanently delete this file?')) return;
    try {
      await deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.fileId !== fileId));
      setSelected(prev => { const s = new Set(prev); s.delete(fileId); return s; });
      setAlert({ type:'success', message:'🗑️ File deleted successfully.' });
    } catch {
      setAlert({ type:'error', message:'❌ Delete failed.' });
    }
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Delete ${selected.size} selected file(s)?`)) return;
    for (const id of selected) await handleDelete(id);
    setSelected(new Set());
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const allTypes = [...new Set(files.map(f => typeLabel(f.fileType)))];

  const sorted = [...files].sort((a, b) => {
    if (sortBy === 'date') return new Date(b.uploadDate||0) - new Date(a.uploadDate||0);
    if (sortBy === 'size') return (b.fileSize||0) - (a.fileSize||0);
    if (sortBy === 'name') return (a.fileName||'').localeCompare(b.fileName||'');
    return 0;
  });

  const filtered = sorted.filter(f => {
    const matchSearch = (f.fileName||'').toLowerCase().includes(search.toLowerCase()) ||
                        (f.ownerName||'').toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === 'all' || typeLabel(f.fileType) === typeFilter;
    return matchSearch && matchType;
  });

  const totalSize = files.reduce((a, f) => a + (f.fileSize||0), 0);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content admin-main">
        {/* Header */}
        <div className="admin-banner">
          <div className="admin-banner-left">
            <div className="admin-banner-badge">
              <span>📁</span><span>File Management</span>
            </div>
            <h1 className="admin-banner-title">Manage Files</h1>
            <p className="admin-banner-sub">View, manage, and delete all files in the system</p>
          </div>
          <div className="admin-banner-right">
            {selected.size > 0 && (
              <button className="btn btn-danger" onClick={handleBulkDelete}>
                🗑️ Delete {selected.size} Selected
              </button>
            )}
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* File Stats */}
        <div className="user-mini-stats">
          {[
            { label:'Total Files',   val: files.length,          color:'#4f46e5' },
            { label:'Total Size',    val: fmtSize(totalSize),     color:'#2563eb' },
            { label:'File Types',    val: allTypes.length,        color:'#7c3aed' },
            { label:'This Week',     val: files.filter(f => {
                const d = new Date(f.uploadDate||0);
                return (Date.now()-d.getTime()) < 7*86400000;
              }).length,                                           color:'#059669' },
          ].map((s,i) => (
            <div key={i} className="ums-card" style={{borderTop:`3px solid ${s.color}`}}>
              <div className="ums-num" style={{color:s.color}}>{s.val}</div>
              <div className="ums-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="glass-card-admin" style={{marginBottom:20}}>
          <div className="users-toolbar">
            <div className="users-toolbar-left">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input type="text" className="admin-search"
                  placeholder="Search files or owners..."
                  value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
              <select className="admin-filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="admin-filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="date">Sort: Latest</option>
                <option value="size">Sort: Largest</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>
            <span className="result-count">{filtered.length} file{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* File Table */}
        <div className="glass-card-admin">
          {loading ? (
            <div style={{padding:60,display:'flex',justifyContent:'center'}}>
              <div className="loading-spinner"/>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📂</div>
              <p>No files found.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{width:40}}>
                      <input type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={e => {
                          if (e.target.checked) setSelected(new Set(filtered.map(f => f.fileId)));
                          else setSelected(new Set());
                        }}
                        style={{accentColor:'var(--indigo)',width:15,height:15,cursor:'pointer'}}
                      />
                    </th>
                    <th>File Name</th>
                    <th>Owner</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Upload Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(f => (
                    <tr key={f.fileId} className={selected.has(f.fileId) ? 'row-selected' : ''}>
                      <td>
                        <input type="checkbox"
                          checked={selected.has(f.fileId)}
                          onChange={() => toggleSelect(f.fileId)}
                          style={{accentColor:'var(--indigo)',width:15,height:15,cursor:'pointer'}}
                        />
                      </td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <span style={{fontSize:'1.5rem',lineHeight:1}}>{fileIcon(f.fileType)}</span>
                          <div>
                            <div style={{fontWeight:600,fontSize:'.875rem',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                              {f.fileName}
                            </div>
                            <div style={{fontSize:'.72rem',color:'var(--fg4)'}}>ID: {f.fileId?.slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div className="user-avatar-sm employee-avatar" style={{width:28,height:28,fontSize:'.75rem'}}>
                            {f.ownerName?.[0] || '?'}
                          </div>
                          <span className="text-secondary">{f.ownerName || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="file-type-badge">{typeLabel(f.fileType)}</span>
                      </td>
                      <td className="text-secondary">{fmtSize(f.fileSize)}</td>
                      <td className="text-secondary text-sm">
                        {f.uploadDate ? new Date(f.uploadDate).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div style={{display:'flex',gap:8}}>
                          <a href={downloadFileUrl(f.fileId)} target="_blank" rel="noreferrer"
                            className="admin-action-btn primary" title="Download">
                            ⬇
                          </a>
                          <button className="admin-action-btn danger"
                            onClick={() => handleDelete(f.fileId)} title="Delete">
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
