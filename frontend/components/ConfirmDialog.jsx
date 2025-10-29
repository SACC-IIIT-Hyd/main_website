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
      className="confirm-dialog-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(15px)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="confirm-dialog-modal"
        style={{
          maxWidth: 400,
          width: "90%",
          background: "linear-gradient(135deg, rgba(75, 0, 130, 0.12) 0%, rgba(239, 223, 194, 0.08) 100%)",
          border: "2px solid #F87272",
          borderRadius: 20,
          overflow: "hidden",
          backdropFilter: "blur(20px) saturate(1.2)",
          boxShadow: "0 20px 60px rgba(75, 0, 130, 0.3)",
        }}
      >
        <div className="panel-header" style={{
          padding: "1.5rem 2rem 1rem 2rem",
          borderBottom: "1px solid rgba(248, 114, 114, 0.3)",
          background: "linear-gradient(135deg, rgba(248, 114, 114, 0.08) 0%, rgba(239, 223, 194, 0.04) 100%)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h3 className="panel-title" style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "#F87272",
            margin: 0,
            textShadow: "1px 1px 2px rgba(0, 0, 0, 0.3)",
            letterSpacing: "0.5px"
          }}>
            {title}
          </h3>
          <Button variant="ghost" onClick={onCancel} className="close-button" style={{
            padding: "0.5rem",
            background: "rgba(248, 114, 114, 0.2)",
            border: "2px solid #F87272",
            borderRadius: "8px",
            color: "#F87272"
          }}>
            <X size={20} />
          </Button>
        </div>
        <div className="panel-content" style={{
          padding: "1.5rem 2rem",
          color: "#EFDFC2"
        }}>
          <p style={{ marginBottom: 24, color: "#EFDFC2" }}>{description}</p>
          <div className="form-actions" style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "flex-end"
          }}>
            <Button
              variant="outline"
              onClick={onCancel}
              className="action-button"
              style={{
                background: "rgba(143, 90, 51, 0.15)",
                border: "2px solid rgba(143, 90, 51, 0.4)",
                color: "#EFDFC2",
                padding: "0.5rem 1rem",
                borderRadius: "8px"
              }}
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="action-button primary"
              style={{
                background: "rgba(248, 114, 114, 0.2)",
                border: "2px solid #F87272",
                color: "#F87272",
                padding: "0.5rem 1rem",
                borderRadius: "8px"
              }}
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
