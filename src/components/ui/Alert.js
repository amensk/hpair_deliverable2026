import React from 'react';
import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';

const ICONS = { success: FiCheckCircle, error: FiAlertCircle, warning: FiAlertTriangle, info: FiInfo };

const Alert = ({ type = 'info', children, className = '' }) => {
  const Icon = ICONS[type] || FiInfo;
  return (
    <div className={`alert alert--${type} ${className}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
};

export default Alert;
