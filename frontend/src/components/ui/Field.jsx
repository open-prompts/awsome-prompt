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
const Field = ({ id, label, children, error, hint, className = '', required = false }) => {
  // Apply control props (id / aria-invalid) to the FIRST native form control
  // among children, so helper nodes (e.g. hints) can be placed before the input.
  let applied = false;
  const applyControlProps = (node, key) => {
    if (applied || !React.isValidElement(node)) return node;
    if (typeof node.type === 'string' && ['input', 'select', 'textarea'].includes(node.type)) {
      applied = true;
      return React.cloneElement(node, { key, id, ...(error ? { 'aria-invalid': true } : {}) });
    }
    return React.cloneElement(node, { key });
  };

  const renderChildren = Array.isArray(children)
    ? children.map(applyControlProps)
    : applyControlProps(children, undefined);

  return (
    <div className={`field ${error ? 'field-invalid' : ''} ${className}`}>
      {label && (
        <label className={`field-label ${required ? 'field-required-label' : ''}`} htmlFor={id}>
          {label}
        </label>
      )}
      {renderChildren}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
};

export default Field;
