import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

// Photo masthead with the transparent header on top, like every hpair.org page.
const COPY = {
  login: { eyebrow: 'Delegate Portal', title: 'Delegate Login', sub: 'Sign in to complete your delegate information form for HPAIR 2026.' },
  form: { eyebrow: 'HPAIR 2026', title: 'Delegate Information Form', sub: 'Four short sections. Your answers save automatically on this device until you submit.' },
  admin: { eyebrow: 'Admin', title: 'All Submissions', sub: 'Every delegate form submitted to this project, newest first.' },
};

const Masthead = () => {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const key = !user ? 'login' : pathname.startsWith('/admin') ? 'admin' : 'form';
  const copy = COPY[key];

  return (
    <div className="masthead" data-compact={key === 'login' ? undefined : 'true'}>
      <img className="masthead__photo" src={`${process.env.PUBLIC_URL}/hero-delegates.jpg`} alt="" aria-hidden="true" />
      <div className="masthead__overlay" aria-hidden="true" />
      <Header />
      <div className="masthead__content">
        {!loading && (
          <>
            <span className="masthead__eyebrow">{copy.eyebrow}</span>
            <h1 className="masthead__title">{copy.title}</h1>
            <p className="masthead__sub">{copy.sub}</p>
          </>
        )}
      </div>
      <div className="brand-stripe" aria-hidden="true">
        <span /><span /><span />
      </div>
    </div>
  );
};

export default Masthead;
