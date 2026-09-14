import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { signOutUser } from '../../services/authService';
import { useToast } from '../ui/Toast';

// Transparent header that sits over the masthead photo, like hpair.org.
const Header = () => {
  const { user } = useAuth();
  const toast = useToast();

  const handleLogout = async () => {
    const res = await signOutUser();
    if (res.success) toast.info('You have been logged out.');
    else toast.error(res.message);
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-header__brand" href="https://www.hpair.org/" target="_blank" rel="noreferrer">
          <img
            className="site-header__logo"
            src={`${process.env.PUBLIC_URL}/hpair-logo-white.png`}
            alt="HPAIR - Harvard College Project for Asian and International Relations"
            width="1500"
            height="227"
          />
        </a>
        <nav className="site-header__nav" aria-label="Primary">
          <a className="site-header__link" href="https://www.hpair.org/" target="_blank" rel="noreferrer">
            hpair.org
          </a>
          {user && (
            <>
              <NavLink to="/" end className="site-header__link">
                My Form
              </NavLink>
              <NavLink to="/admin" className="site-header__link">
                Submissions
              </NavLink>
            </>
          )}
          {user ? (
            <button type="button" className="site-header__cta" onClick={handleLogout} title={`Signed in as ${user.email}`}>
              Log Out
            </button>
          ) : (
            <span className="site-header__cta" aria-current="page">
              Delegate Login
            </span>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
