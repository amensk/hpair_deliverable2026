import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { signOutUser } from '../../services/authService';
import { useToast } from '../ui/Toast';

// Mirrors the hpair.org primary navigation (same items, same dropdowns),
// followed by the portal's own links when signed in.
const HPAIR = 'https://www.hpair.org';
const NAV = [
  { label: 'Home', href: `${HPAIR}/` },
  {
    label: 'About Us',
    items: [
      { label: 'Our Team', href: `${HPAIR}/our-team` },
      { label: 'Board of Advisors', href: `${HPAIR}/advisors` },
    ],
  },
  {
    label: 'Conferences',
    items: [
      { label: 'HPAIR Conference', href: `${HPAIR}/hconf` },
      { label: 'Asia Conference', href: `${HPAIR}/aconf` },
      { label: 'Virtual Conference', href: `${HPAIR}/vconf` },
      { label: 'Youth Leadership Summit', href: `${HPAIR}/hyls` },
    ],
  },
  { label: 'Partner With Us', href: `${HPAIR}/partner-with-us` },
  { label: 'FAQs', href: `${HPAIR}/faqs` },
];

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
        <a className="site-header__brand" href={`${HPAIR}/`} target="_blank" rel="noreferrer">
          <img
            className="site-header__logo"
            src={`${process.env.PUBLIC_URL}/hpair-logo-white.png`}
            alt="HPAIR - Harvard College Project for Asian and International Relations"
            width="1500"
            height="227"
          />
        </a>

        <nav className="site-header__nav" aria-label="Primary">
          <ul className="site-nav">
            {NAV.map((item) =>
              item.items ? (
                <li key={item.label} className="site-nav__item site-nav__item--folder">
                  <button type="button" className="site-nav__link" aria-haspopup="true" aria-expanded="false">
                    {item.label} <FiChevronDown size={14} aria-hidden="true" />
                  </button>
                  <ul className="site-nav__dropdown">
                    {item.items.map((sub) => (
                      <li key={sub.href}>
                        <a href={sub.href} target="_blank" rel="noreferrer">
                          {sub.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.label} className="site-nav__item">
                  <a className="site-nav__link" href={item.href} target="_blank" rel="noreferrer">
                    {item.label}
                  </a>
                </li>
              )
            )}
            {user && (
              <>
                <li className="site-nav__item site-nav__item--portal" aria-hidden="true" />
                <li className="site-nav__item">
                  <NavLink to="/" end className="site-nav__link">
                    My Form
                  </NavLink>
                </li>
                <li className="site-nav__item">
                  <NavLink to="/admin" className="site-nav__link">
                    Submissions
                  </NavLink>
                </li>
              </>
            )}
          </ul>
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
