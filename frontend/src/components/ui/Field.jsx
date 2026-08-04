import React from 'react';

/**
 * Labeled form field (replaces @carbon/react TextInput/TextArea/Select wrappers).
 * Associates the label with the child input via htmlFor/id so that
 * getByLabelText works in tests and screen readers.
 *
 * @param {Object} props
 * @param {string} props.id - id passed to the control and label htmlFor
 * @param {string} props.label - Visible label text
 * @param {React.ReactNode} props.children - The input/select/textarea control
 * @param {string} [props.error] - Validation message shown under the control
 * @param {string} [props.hint] - Optional helper text
 * @param {string} [props.className] - Extra class for the wrapper
 */
const Field = ({ id, label, children, error, hint, className = '', required = false }) => (
  <div className={`field ${error ? 'field-invalid' : ''} ${className}`}>
    {label && (
      <label className={`field-label ${required ? 'field-required-label' : ''}`} htmlFor={id}>
        {label}
      </label>
    )}
    {React.cloneElement(children, { id, ...(error ? { 'aria-invalid': true } : {}) })}
    {hint && !error && <span className="field-hint">{hint}</span>}
    {error && <span className="field-error">{error}</span>}
  </div>
);

export default Field;
