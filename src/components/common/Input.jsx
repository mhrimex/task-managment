/**
 * src/components/common/Input.jsx
 */
import React, { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(({ 
  label, 
  error, 
  icon: Icon,
  className = '',
  type = 'text',
  ...props 
}, ref) => {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputContainer}>
        {Icon && <Icon className={styles.icon} size={18} />}
        {type === 'textarea' ? (
          <textarea 
            ref={ref}
            className={`${styles.input} ${styles.textarea} ${Icon ? styles.withIcon : ''} ${error ? styles.errorInput : ''}`}
            {...props}
          />
        ) : type === 'select' ? (
          <select 
            ref={ref}
            className={`${styles.input} ${styles.select} ${Icon ? styles.withIcon : ''} ${error ? styles.errorInput : ''}`}
            {...props}
          >
            {props.children}
          </select>
        ) : (
          <input 
            type={type}
            ref={ref}
            className={`${styles.input} ${Icon ? styles.withIcon : ''} ${error ? styles.errorInput : ''}`}
            {...props}
          />
        )}
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
