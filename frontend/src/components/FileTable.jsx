import { downloadFileUrl } from '../services/api';

function fileIcon(type) {
  if (!type) return '📄';
  if (type.includes('pdf')) return '📕';
  if (type.includes('word')) return '📘';
  if (type.includes('excel') || type.includes('spreadsheet')) return '📗';
  if (type.includes('powerpoint') || type.includes('presentation')) return '📙';
  if (type.includes('image')) return '🖼️';
  if (type.includes('zip')) return '📦';
  if (type.includes('text')) return '📝';
  return '📄';
}

function fmtSize(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1048576).toFixed(1) + ' MB';
}

export default function FileTable({ files, showOwner = true, onDelete, showShare = false, onShare }) {
  if (!files || files.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📂</div>
        <p>No files found.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>File Name</th>
            {showOwner && <th>Owner</th>}
            <th>Size</th>
            <th>Uploaded</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.fileId}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="file-icon">{fileIcon(file.fileType)}</span>
                  <strong>{file.fileName}</strong>
                </div>
              </td>
              {showOwner && <td className="text-secondary">{file.ownerName || '-'}</td>}
              <td className="text-secondary">{fmtSize(file.fileSize)}</td>
              <td className="text-secondary text-sm">
                {file.uploadDate ? new Date(file.uploadDate).toLocaleDateString() : '-'}
              </td>
              <td>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a
                    href={downloadFileUrl(file.fileId)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-success btn-sm"
                  >⬇ Download</a>
                  {showShare && onShare && (
                    <button onClick={() => onShare(file)} className="btn btn-primary btn-sm">🔗</button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this file permanently?')) onDelete(file.fileId);
                      }}
                      className="btn btn-danger btn-sm"
                    >🗑</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
