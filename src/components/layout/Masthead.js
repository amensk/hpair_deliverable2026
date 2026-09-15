import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n';

// Photo masthead with the transparent header on top, like every hpair.org page.
const Masthead = () => {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const { pathname } = useLocation();
  const key = !user ? 'login' : pathname.startsWith('/admin') ? 'admin' : 'form';

  return (
    <div className="masthead" data-compact={key === 'login' ? undefined : 'true'}>
      <img className="masthead__photo" src={`${process.env.PUBLIC_URL}/hero-delegates.jpg`} alt="" aria-hidden="true" width="1920" height="1080" fetchpriority="high" decoding="async" />
      <div className="masthead__overlay" aria-hidden="true" />
      <Header />
      <div className="masthead__content">
        {!loading && (
          <>
            <span className="masthead__eyebrow">{t(`masthead.${key}.eyebrow`)}</span>
            <h1 className="masthead__title">{t(`masthead.${key}.title`)}</h1>
            <p className="masthead__sub">{t(`masthead.${key}.sub`)}</p>
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
