import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getUser, logout } from '../lib/auth';

const links = [
  { to: '/users', label: 'Users' },
  { to: '/import', label: 'Bulk Import' },
  { to: '/tests', label: 'Tests' },
  { to: '/mcq-bank', label: 'Question Bank' },
  { to: '/enquiries', label: 'Enquiries' },
  { to: '/scholarship', label: 'Scholarship' },
  { to: '/scholarship/programmes', label: 'Programmes' },
];

const Layout: React.FC<{ title: string; actions?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  actions,
  children,
}) => {
  const navigate = useNavigate();
  const user = getUser();

  const doLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Knovate Admin</div>
        <nav>
          {links.map((l) => (
            // `end` on every link: without it /scholarship stays highlighted
            // while you are on /scholarship/programmes, so the sidebar shows two
            // active items and neither tells you where you are.
            <NavLink key={l.to} to={l.to} end className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="spacer" />
        <div className="who">{user?.email}</div>
        <button className="secondary" onClick={doLogout}>Sign out</button>
      </aside>
      <div className="main">
        <div className="topbar">
          <h1>{title}</h1>
          <div className="row">{actions}</div>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
