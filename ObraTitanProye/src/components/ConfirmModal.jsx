import React from "react";
import "./ConfirmModal.css";

export default function ConfirmModal({
  open,
  variant = "info", // "info" | "warning" | "error"
  title = "",
  message = "",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  showCancel = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="ot-modal-backdrop" onClick={onClose}>
      <div className="ot-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`ot-modal-icon ${variant}`} aria-hidden="true">!</div>
        <h3 className="ot-modal-title">{title}</h3>
        <p className="ot-modal-msg">{message}</p>

        <div className="ot-modal-actions">
          {showCancel && (
            <button className="ot-btn ot-btn-secondary" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button
            className="ot-btn ot-btn-primary"
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
