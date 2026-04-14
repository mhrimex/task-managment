/**
 * src/components/common/Button.jsx
 */
import React from 'react';
import styles from './Button.module.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon,
  className = '',
  fullWidth = false,
  ...props 
}) => {
  const baseClass = styles.btn;
  const variantClass = styles[variant];
  const sizeClass = styles[size];
  const fullWidthClass = fullWidth ? styles.fullWidth : '';

  return (
    <button 
      className={`${baseClass} ${variantClass} ${sizeClass} ${fullWidthClass} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : 20} className={styles.icon} />}
      {children}
    </button>
  );
};

export default Button;
