import React from 'react';
import { FaLinkedinIn, FaInstagram, FaFacebookF, FaXTwitter } from 'react-icons/fa6';
import { useI18n } from '../../i18n';
import LanguageSwitcher from '../ui/LanguageSwitcher';

const LINKS = [
  { key: 'nav.aboutUs', href: 'https://www.hpair.org/our-team' },
  { key: 'nav.virtualConference', href: 'https://www.hpair.org/vconf' },
  { key: 'nav.partnerWithUs', href: 'https://www.hpair.org/partner-with-us' },
  { key: 'footer.faqsContact', href: 'https://www.hpair.org/faqs' },
];

const SOCIAL = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/harvard-project-for-asian-and-international-relations-hpair-', Icon: FaLinkedinIn },
  { label: 'Instagram', href: 'https://www.instagram.com/officialhpair/', Icon: FaInstagram },
  { label: 'Facebook', href: 'https://www.facebook.com/official.hpair/', Icon: FaFacebookF },
  { label: 'X', href: 'https://x.com/hpairtweets', Icon: FaXTwitter },
];

// Crimson footer mirroring hpair.org: logo + tagline left, links + socials right.
const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <img
            src={`${process.env.PUBLIC_URL}/hpair-logo-white.png`}
            alt="HPAIR - Harvard College Project for Asian and International Relations"
            width="1500"
            height="227"
          />
          <p>{t('footer.tagline')}</p>
        </div>
        <div className="site-footer__right">
          <nav className="site-footer__links" aria-label="HPAIR">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
                {t(l.key)}
              </a>
            ))}
          </nav>
          <div className="site-footer__social">
            {SOCIAL.map(({ label, href, Icon }) => (
              <a key={href} href={href} target="_blank" rel="noreferrer" aria-label={t('footer.social', { name: label })}>
                <Icon size={26} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span>
            {t('footer.questions')} <a href="mailto:cqiu@college.harvard.edu">cqiu@college.harvard.edu</a> ·{' '}
            <a href="mailto:ashleyzheng@college.harvard.edu">ashleyzheng@college.harvard.edu</a>
          </span>
          <LanguageSwitcher />
        </span>
      </div>
    </footer>
  );
};

export default Footer;
