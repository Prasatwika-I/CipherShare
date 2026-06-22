import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import PageHeader from '../../components/PageHeader';
import { getManagerTeam } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function TeamFiles() {
  const { user }                = useAuth();
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getManagerTeam().then(r => setMembers(r.data.members || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <PageHeader title="Team Files" subtitle={`${user?.department || ''} department members`} />
        <div className="glass-card">
          <div className="card-header">
            <h2 className="card-title">{user?.department} Team ({members.length} members)</h2>
            <a href="/manager/share-file" className="btn btn-primary btn-sm">🔗 Share a File</a>
          </div>
          {loading ? <div className="loading-spinner" /> : members.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">👥</div><p>No other team members in your department yet.</p></div>
          ) : (
            <div className="team-grid">
              {members.map(m => (
                <div key={m.uid} className="team-member-card glass-card">
                  <div className={`member-avatar ${m.role}-avatar`}>{m.name?.[0] || '?'}</div>
                  <div className="member-info">
                    <div className="member-name">{m.name}</div>
                    <div className="member-email text-secondary">{m.email}</div>
                    <span className={`badge badge-${m.role}`}>{m.role}</span>
                  </div>
                  <a href="/manager/share-file" className="btn btn-primary btn-sm" style={{marginTop:12}}>Share File</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
