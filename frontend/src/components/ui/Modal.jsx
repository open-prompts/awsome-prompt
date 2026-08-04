import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons';

/**
 * Accessible modal dialog (replaces @carbon/react Modal).
 * Renders into document.body via a portal.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is visible
 * @param {string} props.title - Heading text
 * @param {string} [props.subtitle] - Small label above the heading
 * @param {React.ReactNode} props.children - Modal body
 * @param {string} [props.primaryLabel] - Primary action button text
 * @param {string} [props.secondaryLabel] - Secondary action button text
 * @param {boolean} [props.primaryDisabled] - Disable primary button
 * @param {boolean} [props.danger] - Style primary button as danger
 * @param {Function} [props.onPrimary] - Primary action callback
 * @param {Function} [props.onClose] - Close/escape/overlay callback
 * @param {string} [props.className] - Extra class for the modal card
 */
const Modal = ({
  open,
  title,
  subtitle,
  children,
  primaryLabel,
  secondaryLabel,
  primaryDisabled = false,
  danger = false,
  onPrimary,
  onClose,
  className = '',
  size = 'md',
}) => {
  const dialogRef = useRef(null);
  // Keep the latest handler in a ref so the focus/listener effect only runs
  // when `open` toggles. Without this, any inline `onClose` prop (recreated on
  // every parent render, e.g. while typing in a modal input) would re-trigger
  // the effect and steal focus from the input.
  const handleKeyDownRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && onClose) {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    handleKeyDownRef.current = handleKeyDown;
  }, [handleKeyDown]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (handleKeyDownRef.current) handleKeyDownRef.current(e);
    };
    document.addEventListener('keydown', onKeyDown, true);
    // Focus the dialog when opened
    const t = setTimeout(() => {
      if (dialogRef.current) dialogRef.current.focus();
    }, 0);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      clearTimeout(t);
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div
        ref={dialogRef}
        className={`modal ${size === 'lg' ? 'modal-lg' : ''} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="modal-header">
          <div className="modal-heading">
            {subtitle && <span className="modal-subtitle">{subtitle}</span>}
            <h3 className="modal-title">{title}</h3>
          </div>
          {onClose && (
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
              <CloseIcon size={18} />
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
        {(primaryLabel || secondaryLabel) && (
          <div className="modal-footer">
            {secondaryLabel && onClose && (
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                {secondaryLabel}
              </button>
            )}
            {primaryLabel && onPrimary && (
              <button
                type="button"
                className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
                onClick={onPrimary}
                disabled={primaryDisabled}
              >
                {primaryLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
