import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const ConfirmDialog = ({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading,
}) => {
  if (!open) return null;
  return (
    <div
      className="profile-panel-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(15px)",
        zIndex: 1500,
      }}
    >
      <div
        className="profile-panel-modal"
        style={{
          maxWidth: 400,
          width: "90%",
          margin: "10% auto",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        <div className="panel-header">
          <h3 className="panel-title" style={{ fontSize: "1.5rem" }}>
            {title}
          </h3>
          <Button variant="ghost" onClick={onCancel} className="close-button">
            <X size={20} />
          </Button>
        </div>
        <div className="panel-content">
          <p style={{ marginBottom: 24 }}>{description}</p>
          <div className="form-actions">
            <Button
              variant="outline"
              onClick={onCancel}
              className="action-button"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="action-button primary"
            >
              {loading ? "Submitting..." : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
