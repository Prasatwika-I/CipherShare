import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './LandingPage.css';
import logoImg from '../assets/ciphershare-logo.png.png';

/* ── DATA ─────────────────────────────────────────────── */
const FILES = [
  { icon:'📘', name:'Project_Plan_Q3.pdf',    shared:'Managers',     badge:'View',     date:'Jun 18, 2026' },
  { icon:'📗', name:'Design_System_v2.fig',    shared:'Designers',    badge:'Download', date:'Jun 16, 2026' },
  { icon:'📊', name:'Financial_Report.xlsx',   shared:'Finance Team', badge:'View',     date:'Jun 15, 2026' },
  { icon:'📄', name:'HR_Policy_2026.docx',     shared:'All Staff',    badge:'View',     date:'Jun 14, 2026' },
  { icon:'📝', name:'Sprint_Retrospective.md', shared:'Engineering',  badge:'Download', date:'Jun 12, 2026' },
];

const ROLES = [
  {
    cls:'lp-role-card-admin', icon:'👑', title:'Admin', badge:'Full Access',
    subtitle:'Complete system control',
    perms:['User & Role Management','Delete Any File','View All Activity Logs','System Configuration','Access Control Setup'],
  },
  {
    cls:'lp-role-card-manager', icon:'💼', title:'Manager', badge:'Team Lead',
    subtitle:'Manage your team files',
    perms:['Upload & Organize Files','Share with Departments','View Team Activity','Manage Permissions','Generate Reports'],
  },
  {
    cls:'lp-role-card-employee', icon:'👤', title:'Employee', badge:'Contributor',
    subtitle:'Upload and collaborate',
    perms:['Upload Own Files','Share Documents','View Team Files','Download Access','Profile Management'],
  },
  {
    cls:'lp-role-card-viewer', icon:'👁', title:'Viewer', badge:'Read-Only',
    subtitle:'View and download only',
    perms:['View Shared Files','Download Permitted Files','Browse File Directory','Read-Only Access','Secure Viewing'],
  },
];

const FEATURES = [
  { icon:'🔐', bg:'rgba(99,102,241,0.08)',  title:'Enterprise Security',        desc:'Firebase JWT on every API call. Server-side role enforcement in Spring Boot.' },
  { icon:'🛡️', bg:'rgba(168,85,247,0.08)',  title:'Role-Based Control',         desc:'Admin, Manager, Employee, Viewer — scoped permissions enforced at every layer.' },
  { icon:'📁', bg:'rgba(59,130,246,0.08)',  title:'Cloud File Storage',         desc:'Globally distributed Firestore. Files synced, safe, and accessible anywhere.' },
  { icon:'📊', bg:'rgba(5,150,105,0.08)',   title:'Audit & Activity Logs',      desc:'Every action timestamped. Login, upload, share, delete — full compliance trail.' },
];

const STEPS = [
  { num:'01', icon:'✍️', title:'Create Your Account',    desc:'Sign up in 60 seconds with email or Google. Firebase handles authentication securely end-to-end.' },
  { num:'02', icon:'👑', title:'Admin Assigns Your Role', desc:'Your administrator grants you a role — Admin, Manager, Employee, or Viewer. Permissions apply instantly.' },
  { num:'03', icon:'📂', title:"Access What's Yours",    desc:'Upload, share, and download files based on your exact role. Nothing more, nothing less.' },
];

const STATS = [
  { icon:'📁', num:'50K+',   grad:true,  label:'Files Shared',      sub:'Across all organizations' },
  { icon:'🏢', num:'500+',   grad:true,  label:'Organizations',     sub:'Trust CipherShare daily'  },
  { icon:'⚡', num:'99.9%', grad:false, label:'Uptime SLA',         sub:'Enterprise grade reliability' },
  { icon:'🛡️', num:'24/7',  grad:false, label:'Security Monitoring',sub:'Zero downtime incidents' },
];

const TESTIMONIALS = [
  {
    text:'"CipherShare completely transformed how our teams share sensitive documents. The role-based access gives our compliance team full confidence that files only reach the right people."',
    name:'Sarah Chen', role:'IT Director', company:'FinCore Technologies',
    avatarBg:'linear-gradient(135deg,#6366f1,#9333ea)', initial:'SC',
  },
  {
    text:'"The permission management is exactly what we needed. Our managers can now share files with their teams without worrying about unauthorized access. Setup took under 10 minutes."',
    name:'Marcus Williams', role:'Head of Operations', company:'Vertex Corp',
    avatarBg:'linear-gradient(135deg,#2563eb,#0ea5e9)', initial:'MW',
  },
  {
    text:'"We evaluated Box and SharePoint before finding CipherShare. The audit logs and role hierarchy are outstanding — and the Spring Boot API integrates perfectly with our existing stack."',
    name:'Priya Patel', role:'Cloud Architect', company:'NovaSystems Ltd',
    avatarBg:'linear-gradient(135deg,#059669,#10b981)', initial:'PP',
  },
];

/* ── COMPONENT ────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled,  setScrolled]  = useState(false);
  const [activeRow, setActiveRow] = useState(0);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveRow(r => (r + 1) % FILES.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="lp">

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <nav className={`lp-nav${scrolled ? ' lp-scrolled' : ''}`}>
        <Link to="/" className="lp-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logoImg} alt="CipherShare Logo" style={{ width: '100%', maxWidth: '200px', height: 'auto', objectFit: 'contain' }} />
        </Link>

        <div className="lp-nav-links">
          <a href="#hero">Home</a>
          <a href="#features">Features</a>
          <a href="#workflow">How It Works</a>
          <a href="#roles">About Us</a>
          <a href="#stats">Contact</a>
        </div>

        <div className="lp-nav-end">
          <Link to="/login"    className="lp-nav-login">Login</Link>
          <Link to="/register" className="lp-nav-cta">Get Started</Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════ */}
      <section className="lp-hero" id="hero">
        <div className="lp-hero-grid"/>

        <div className="lp-hero-inner">
          {/* LEFT */}
          <div className="lp-hero-left">
            <div className="lp-hero-badge">
              <span className="lp-badge-dot"/>
              ✦ Secure · Role-Based · Enterprise-Ready
            </div>

            <h1 className="lp-hero-h1">
              Secure File Sharing<br/>
              <span className="lp-grad-text">Made Simple</span>
            </h1>

            <p className="lp-hero-sub">
              Share, manage and control your files securely with role-based
              access and enterprise-grade protection — built for teams of every size.
            </p>

            <div className="lp-hero-btns">
              <Link to="/register" className="lp-btn-primary">
                Get Started Free
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <a href="#features" className="lp-btn-secondary">
                Explore Features →
              </a>
            </div>

            <div className="lp-hero-chips">
              {['🔐 End-to-End Encrypted','👥 Role-Based Access','☁️ Cloud Storage','📊 Audit Logs'].map(c => (
                <span key={c} className="lp-hero-chip">{c}</span>
              ))}
            </div>
          </div>

          {/* RIGHT — DASHBOARD PREVIEW */}
          <div className="lp-hero-right">
            {/* Floating permission card */}
            <div className="lp-float-perms">
              <div className="lp-float-perms-head">🔐 Permissions</div>
              {[['✓','View Files',true],['✓','Download',true],['✓','Share',true],['✕','Delete',false]].map(([ic,lb,ok])=>(
                <div key={lb} className="lp-float-perm-row">
                  <span className={ok?'lp-perm-yes':'lp-perm-no'}>{ic}</span>
                  <span style={{color:ok?'#374151':'#94a3b8',fontSize:'0.68rem'}}>{lb}</span>
                </div>
              ))}
            </div>

            {/* Floating notification */}
            <div className="lp-float-notif">
              <div className="lp-float-notif-icon">📤</div>
              <div>
                <div className="lp-float-notif-t">File shared successfully</div>
                <div className="lp-float-notif-s">Q3_Plan.pdf → Finance Team</div>
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="lp-dashboard">
              {/* Chrome bar */}
              <div className="lp-db-chrome">
                <div className="lp-db-dots">
                  <span style={{background:'#ef4444'}}/><span style={{background:'#f59e0b'}}/><span style={{background:'#22c55e'}}/>
                </div>
                <div className="lp-db-url">ciphershare.app/dashboard</div>
                <button className="lp-db-action">⬆ Upload</button>
              </div>

              {/* Stats row */}
              <div className="lp-db-stats">
                {[
                  {lbl:'Total Files',  val:'142', sub:'↑ 12 this week',      col:'#6366f1'},
                  {lbl:'Team Members', val:'28',  sub:'3 active now',        col:'#059669'},
                  {lbl:'Shared Today', val:'34',  sub:'↑ 8 from yesterday',  col:'#d97706'},
                  {lbl:'Blocked',      val:'7',   sub:'All secured ✓',        col:'#dc2626'},
                ].map(s=>(
                  <div key={s.lbl} className="lp-db-stat">
                    <div className="lp-db-stat-lbl">{s.lbl}</div>
                    <div className="lp-db-stat-val" style={{color:s.col}}>{s.val}</div>
                    <div className="lp-db-stat-sub">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Body */}
              <div className="lp-db-body">
                {/* Sidebar */}
                <div className="lp-db-sidebar">
                  <div className="lp-db-sb-logo">CS</div>
                  {[['🏠','Dashboard'],['📁','My Files'],['👥','Shared'],['🕐','Recent'],['🗑️','Trash']].map(([ic,lb])=>(
                    <div key={lb} className={`lp-db-sb-item${lb==='My Files'?' lp-db-sb-active':''}`}>{ic} {lb}</div>
                  ))}
                  <div className="lp-db-sb-sep">Admin</div>
                  <div className="lp-db-sb-item">🔑 Roles</div>
                  <div className="lp-db-sb-item">👤 Users</div>
                  <div className="lp-db-sb-item">📋 Logs</div>
                </div>

                {/* Content */}
                <div className="lp-db-content">
                  <div className="lp-db-topbar">
                    <span className="lp-db-title">My Files</span>
                    <div className="lp-db-search">🔍 Search files...</div>
                    <button className="lp-db-new">+ New</button>
                  </div>
                  <div className="lp-db-table-head">
                    <span>Name</span><span>Shared With</span><span>Access</span><span>Modified</span>
                  </div>
                  {FILES.map((f,i)=>(
                    <div key={f.name} className={`lp-db-row${i===activeRow?' lp-db-row-hl':''}`}>
                      <div className="lp-db-fname"><span>{f.icon}</span>{f.name}</div>
                      <span style={{fontSize:'0.62rem',color:'#6366f1',fontWeight:600}}>{f.shared}</span>
                      <span className={`lp-db-badge${f.badge==='Download'?' lp-db-badge-green':''}`}>{f.badge}</span>
                      <span className="lp-db-date">{f.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF BAR */}
      <div className="lp-proof-bar">
        <div className="lp-proof-inner">
          <span className="lp-proof-label">Powered by</span>
          {['🔥 Firebase Auth','⚡ Spring Boot 3','⚛️ React 18','☁️ Cloud Firestore','🎯 Vite 5'].map(t=>(
            <span key={t} className="lp-proof-chip">{t}</span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 2 — ROLES
      ══════════════════════════════════════════ */}
      <section className="lp-section lp-roles-section" id="roles">
        <div className="lp-section-inner">
          <div className="lp-text-center">
            <div className="lp-sec-eyebrow">✦ Access Roles</div>
            <h2 className="lp-sec-h">
              Role-Based Access for<br/>
              <span className="lp-grad-text">Better Control</span>
            </h2>
            <p className="lp-sec-sub">
              Every permission is enforced at the API level — not just the UI.
              Give each team member exactly the access they need.
            </p>
          </div>

          <div className="lp-roles-grid">
            {ROLES.map(r=>(
              <div key={r.title} className={`lp-role-card ${r.cls}`}>
                <div className="lp-role-header">
                  <div className="lp-role-badge">{r.badge}</div>
                  <span className="lp-role-icon">{r.icon}</span>
                  <div className="lp-role-title">{r.title}</div>
                  <div className="lp-role-subtitle">{r.subtitle}</div>
                </div>
                <div className="lp-role-body">
                  {r.perms.map(p=>(
                    <div key={p} className="lp-role-perm">
                      <div className="lp-tick-icon">✓</div>
                      {p}
                    </div>
                  ))}
                </div>
                <Link to="/register" className="lp-role-cta">Get started as {r.title} →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 3 — FEATURES
      ══════════════════════════════════════════ */}
      <section className="lp-section lp-features-section" id="features">
        <div className="lp-section-inner">
          <div className="lp-features-layout">
            {/* Left — feature cards */}
            <div>
              <div className="lp-sec-eyebrow">✦ Features</div>
              <h2 className="lp-sec-h">
                Security. Simplicity.<br/>
                <span className="lp-grad-text">Control.</span>
              </h2>
              <p className="lp-sec-sub lp-sec-sub-left">
                Everything your organization needs to share files safely — without the complexity or the enterprise price tag.
              </p>
              <div className="lp-features-grid">
                {FEATURES.map(f=>(
                  <div key={f.title} className="lp-feat-card">
                    <div className="lp-feat-icon-wrap" style={{background:f.bg}}>{f.icon}</div>
                    <div className="lp-feat-card-title">{f.title}</div>
                    <div className="lp-feat-card-desc">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — shield + stats */}
            <div className="lp-shield-side">
              <div className="lp-shield-visual">
                <span className="lp-shield-emoji">🛡️</span>
                <div className="lp-shield-title">Enterprise-Grade Security</div>
                <div className="lp-shield-sub">
                  Firebase JWT verified on every request. CORS locked to your domain.
                  Session timeout after 30 minutes. Full audit trail for compliance.
                </div>
              </div>
              <div className="lp-stats-mini">
                {[
                  {val:'256-bit',lbl:'AES Encryption',    col:'#6366f1'},
                  {val:'100%',   lbl:'API Auth Coverage',  col:'#9333ea'},
                  {val:'<50ms',  lbl:'Auth Response Time', col:'#3b82f6'},
                  {val:'SOC 2',  lbl:'Compliance Ready',   col:'#059669'},
                ].map(s=>(
                  <div key={s.lbl} className="lp-stat-mini-card">
                    <div className="lp-stat-mini-val" style={{color:s.col}}>{s.val}</div>
                    <div className="lp-stat-mini-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 4 — WORKFLOW
      ══════════════════════════════════════════ */}
      <section className="lp-section lp-workflow-section" id="workflow">
        <div className="lp-section-inner">
          <div className="lp-text-center">
            <div className="lp-sec-eyebrow">✦ How It Works</div>
            <h2 className="lp-sec-h">
              Up and running in<br/>
              <span className="lp-grad-text">3 Simple Steps</span>
            </h2>
            <p className="lp-sec-sub">
              No complex onboarding. No IT department required.
              CipherShare is ready in minutes.
            </p>
          </div>

          <div className="lp-steps-row">
            {STEPS.map(s=>(
              <div key={s.num} className="lp-step-card">
                <div className="lp-step-num">{s.num}</div>
                <span className="lp-step-icon">{s.icon}</span>
                <div className="lp-step-title">{s.title}</div>
                <div className="lp-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 5 — STATISTICS
      ══════════════════════════════════════════ */}
      <section className="lp-section lp-stats-section" id="stats">
        <div className="lp-section-inner">
          <div className="lp-stats-top">
            <div className="lp-sec-eyebrow">✦ Trusted Worldwide</div>
            <h2 className="lp-sec-h">Numbers that<br/><span className="lp-grad-text-2">speak for themselves</span></h2>
          </div>

          <div className="lp-stats-grid">
            {STATS.map(s=>(
              <div key={s.label} className="lp-stat-card">
                <span className="lp-stat-icon">{s.icon}</span>
                <div className={`lp-stat-num${s.grad?' lp-stat-num-grad':''}`}>{s.num}</div>
                <div className="lp-stat-label">{s.label}</div>
                <div className="lp-stat-sublabel">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 6 — TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section className="lp-section lp-testimonials-section" id="testimonials">
        <div className="lp-section-inner">
          <div className="lp-text-center">
            <div className="lp-sec-eyebrow">✦ Customer Stories</div>
            <h2 className="lp-sec-h">
              Loved by teams<br/>
              <span className="lp-grad-text">around the world</span>
            </h2>
            <p className="lp-sec-sub">
              See how organizations use CipherShare to secure their
              most sensitive documents and streamline team collaboration.
            </p>
          </div>

          <div className="lp-testi-grid">
            {TESTIMONIALS.map(t=>(
              <div key={t.name} className="lp-testi-card">
                <div className="lp-testi-stars">
                  {[1,2,3,4,5].map(i=><span key={i} className="lp-testi-star">★</span>)}
                </div>
                <p className="lp-testi-text">{t.text}</p>
                <div className="lp-testi-author">
                  <div className="lp-testi-avatar" style={{background:t.avatarBg}}>{t.initial}</div>
                  <div>
                    <div className="lp-testi-name">{t.name}</div>
                    <div className="lp-testi-role-lbl">{t.role}</div>
                  </div>
                  <div className="lp-testi-company">{t.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="lp-cta-section">
        <div className="lp-cta-inner">
          <span className="lp-cta-eyebrow">✦ Get Started Today</span>
          <h2 className="lp-cta-h">Your files deserve<br/>better protection</h2>
          <p className="lp-cta-p">
            Give every team member exactly the access they need — nothing more, nothing less.
            Join 500+ organizations already using CipherShare.
          </p>
          <div className="lp-cta-btns">
            <Link to="/register" className="lp-cta-btn-w">Create Free Account →</Link>
            <Link to="/login"    className="lp-cta-btn-g">Sign In →</Link>
          </div>
          <p className="lp-cta-note">🛡️ Free to start · No credit card · Powered by Firebase</p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div>
              <div className="lp-footer-brand" style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <img src={logoImg} alt="CipherShare Logo" style={{ width: '100%', maxWidth: '160px', height: 'auto', objectFit: 'contain' }} />
              </div>
              <div className="lp-footer-tagline">
                Secure, role-based file sharing for modern teams.
                Built on Firebase, Spring Boot and React.
              </div>
              <div className="lp-footer-social">
                {['🐦','💼','🐙','📧'].map((ic,i)=>(
                  <div key={i} className="lp-footer-social-btn">{ic}</div>
                ))}
              </div>
            </div>

            <div>
              <div className="lp-footer-col-title">Product</div>
              <div className="lp-footer-col-links">
                <a href="#features">Features</a>
                <a href="#roles">Roles & Access</a>
                <a href="#workflow">How It Works</a>
                <a href="#stats">Statistics</a>
              </div>
            </div>

            <div>
              <div className="lp-footer-col-title">Company</div>
              <div className="lp-footer-col-links">
                <a href="#">About Us</a>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
                <a href="#">Contact</a>
              </div>
            </div>

            <div>
              <div className="lp-footer-col-title">Legal</div>
              <div className="lp-footer-col-links">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Cookie Policy</a>
                <a href="#">Security</a>
              </div>
            </div>
          </div>

          <div className="lp-footer-hr"/>

          <div className="lp-footer-btm">
            <span>© 2026 CipherShare — Secure · Role-Based · Enterprise-Ready</span>
            <span>Spring Boot 3 · Firebase · React 18 · Vite 5</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
