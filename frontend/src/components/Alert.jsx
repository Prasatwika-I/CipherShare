export default function Alert({ type = 'error', message, onClose }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type}`} style={{ position: 'relative' }}>
      {message}
      {onClose && (
        <button
          onClick={onClose}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem' }}
        >✕</button>
      )}
    </div>
  );
}
