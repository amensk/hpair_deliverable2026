import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { signOutUser } from '../../services/authService';
import { useToast } from '../ui/Toast';
import { isAdmin } from '../../utils/admin';
import { useI18n } from '../../i18n';
import LanguageSwitcher from '../ui/LanguageSwitcher';

// Mirrors the hpair.org primary navigation (same items, same dropdowns),
// followed by the portal's own links when signed in.
const HPAIR = 'https://www.hpair.org';
// Public URL of this portal; the header's "Delegate Login" box links here like hpair.org's does.
export const PORTAL_URL = process.env.REACT_APP_PORTAL_URL || 'https://hpair-delegate-portal.vercel.app/';
const NAV = [
  { key: 'nav.home', href: `${HPAIR}/` },
  {
    key: 'nav.aboutUs',
    items: [
      { key: 'nav.ourTeam', href: `${HPAIR}/our-team` },
      { key: 'nav.boardOfAdvisors', href: `${HPAIR}/advisors` },
    ],
  },
  {
    key: 'nav.conferences',
    items: [
      { key: 'nav.hpairConference', href: `${HPAIR}/hconf` },
      { key: 'nav.asiaConference', href: `${HPAIR}/aconf` },
      { key: 'nav.virtualConference', href: `${HPAIR}/vconf` },
      { key: 'nav.youthLeadershipSummit', href: `${HPAIR}/hyls` },
    ],
  },
  { key: 'nav.partnerWithUs', href: `${HPAIR}/partner-with-us` },
  { key: 'nav.faqs', href: `${HPAIR}/faqs` },
];

const Header = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useI18n();

  const handleLogout = async () => {
    const res = await signOutUser();
    if (res.success) toast.info(t(res.messageKey));
    else toast.error(t(res.messageKey));
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
                <li key={item.key} className="site-nav__item site-nav__item--folder">
                  <button type="button" className="site-nav__link" aria-haspopup="true" aria-expanded="false">
                    {t(item.key)} <FiChevronDown size={14} aria-hidden="true" />
                  </button>
                  <ul className="site-nav__dropdown">
                    {item.items.map((sub) => (
                      <li key={sub.href}>
                        <a href={sub.href} target="_blank" rel="noreferrer">
                          {t(sub.key)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.key} className="site-nav__item">
                  <a className="site-nav__link" href={item.href} target="_blank" rel="noreferrer">
                    {t(item.key)}
                  </a>
                </li>
              )
            )}
            {user && (
              <>
                <li className="site-nav__item site-nav__item--portal" aria-hidden="true" />
                <li className="site-nav__item">
                  <NavLink to="/" end className="site-nav__link">
                    {t('nav.myForm')}
                  </NavLink>
                </li>
                {isAdmin(user) && (
                  <li className="site-nav__item">
                    <NavLink to="/admin" className="site-nav__link">
                      {t('nav.submissions')}
                    </NavLink>
                  </li>
                )}
              </>
            )}
          </ul>
          <LanguageSwitcher />
          {user ? (
            <button type="button" className="site-header__cta" onClick={handleLogout} title={user.isAnonymous ? t('nav.guestSession') : t('nav.signedInAs', { email: user.email })}>
              {t('nav.logOut')}
            </button>
          ) : (
            <a className="site-header__cta" href={PORTAL_URL}>
              {t('nav.delegateLogin')}
            </a>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
