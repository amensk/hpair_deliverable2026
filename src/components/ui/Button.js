import React from 'react';

const Button = ({ variant = 'primary', size, loading = false, children, className = '', icon: Icon, iconRight: IconRight, ...rest }) => {
  const classes = ['btn', `btn--${variant}`, size ? `btn--${size}` : '', className].filter(Boolean).join(' ');
  return (
    <button className={classes} disabled={loading || rest.disabled} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className="spinner" aria-hidden="true" /> : Icon ? <Icon size={18} aria-hidden="true" /> : null}
      <span>{children}</span>
      {IconRight && !loading ? <IconRight size={18} aria-hidden="true" /> : null}
    </button>
  );
};

export default Button;
