import React from 'react';
import { FaLinkedinIn, FaInstagram, FaFacebookF, FaXTwitter } from 'react-icons/fa6';

const LINKS = [
  { label: 'About Us', href: 'https://www.hpair.org/our-team' },
  { label: 'Virtual Conference', href: 'https://www.hpair.org/vconf' },
  { label: 'Partner With Us', href: 'https://www.hpair.org/partner-with-us' },
  { label: 'FAQs and Contact', href: 'https://www.hpair.org/faqs' },
];

const SOCIAL = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/harvard-project-for-asian-and-international-relations-hpair-', Icon: FaLinkedinIn },
  { label: 'Instagram', href: 'https://www.instagram.com/officialhpair/', Icon: FaInstagram },
  { label: 'Facebook', href: 'https://www.facebook.com/official.hpair/', Icon: FaFacebookF },
  { label: 'X', href: 'https://x.com/hpairtweets', Icon: FaXTwitter },
];

// Crimson footer mirroring hpair.org: logo + tagline left, links + socials right.
const Footer = () => (
  <footer className="site-footer">
    <div className="site-footer__inner">
      <div className="site-footer__brand">
        <img
          src={`${process.env.PUBLIC_URL}/hpair-logo-white.png`}
          alt="HPAIR - Harvard College Project for Asian and International Relations"
          width="1500"
          height="227"
        />
        <p>A student-run organization at Harvard College.</p>
      </div>
      <div className="site-footer__right">
        <nav className="site-footer__links" aria-label="HPAIR">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="site-footer__social">
          {SOCIAL.map(({ label, href, Icon }) => (
            <a key={href} href={href} target="_blank" rel="noreferrer" aria-label={`HPAIR on ${label}`}>
              <Icon size={26} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </div>
    <div className="site-footer__bottom">
      <span>© {new Date().getFullYear()} HPAIR · Delegate Portal</span>
      <span>
        Questions about this form? <a href="mailto:cqiu@college.harvard.edu">cqiu@college.harvard.edu</a> ·{' '}
        <a href="mailto:ashleyzheng@college.harvard.edu">ashleyzheng@college.harvard.edu</a>
      </span>
    </div>
  </footer>
);

export default Footer;
