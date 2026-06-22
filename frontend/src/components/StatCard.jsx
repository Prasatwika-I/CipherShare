export default function StatCard({ icon, number, label, linkText, linkHref }) {
  return (
    <div className="stat-card glass-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-number">{number}</div>
      <div className="stat-label">{label}</div>
      {linkText && linkHref && (
        <a href={linkHref} className="stat-link">{linkText} →</a>
      )}
    </div>
  );
}
