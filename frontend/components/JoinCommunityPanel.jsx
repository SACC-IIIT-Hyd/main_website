import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";

const JoinCommunityPanel = ({
  community,
  userProfile,
  onClose,
  onJoinSuccess,
}) => {
  const [identifierType, setIdentifierType] = useState("existing");
  const [customIdentifier, setCustomIdentifier] = useState("");
  const [customName, setCustomName] = useState("");
  const [loading, setLoading] = useState(false);

  // If userProfile is null, show a message instead of the join form
  if (!userProfile) {
    return (
      <div className="profile-panel-overlay" onClick={onClose}>
        <div
          className="profile-panel-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="panel-header">
            <div>
              <h1 className="panel-title">Profile Setup Required</h1>
              <p className="panel-subtitle">
                You need to complete your profile setup first
              </p>
            </div>
            <Button className="close-button" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
          <div className="panel-content">
            <div className="form-section">
              <div className="alert error">
                <AlertCircle className="alert-icon" />
                <div className="alert-content">
                  <h4 className="alert-title">Profile Not Found</h4>
                  <p className="alert-message">
                    Your profile setup was not completed properly. Please
                    refresh the page and complete your profile setup again.
                  </p>
                </div>
              </div>
              <div className="form-actions">
                <Button
                  onClick={() => window.location.reload()}
                  className="action-button primary"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dialog state for join request
  const [showDialog, setShowDialog] = useState(false);

  const handleAddIdentifier = async () => {
    if (identifierType === "custom" && (!customIdentifier || !customName)) {
      toast.error("Please fill in all custom identifier fields");
      return;
    }
    setShowDialog(true);
  };

  const confirmAddIdentifier = async () => {
    setLoading(true);
    try {
      if (identifierType === "custom") {
        const requestData = {
          label: customName,
          value: customIdentifier,
        };

        const response = await fetch("/api/connect/profile/identifiers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(requestData),
        });

        if (response.ok) {
          toast.success(
            "Identifier added successfully! You can now join this community using this identifier."
          );
          setShowDialog(false);
          onJoinSuccess();
        } else {
          const error = await response.json();
          toast.error(`Error: ${error.detail || "Failed to add identifier"}`);
        }
      } else {
        // For existing identifiers, just show success message
        toast.success(
          `Your request was successful. Please follow the invite link or instructions provided.`
        );
        setShowDialog(false);
        onJoinSuccess();
      }
    } catch (error) {
      console.error("Error adding identifier:", error);
      toast.error("Failed to add identifier. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIdentifierType("existing");
    setCustomIdentifier("");
    setCustomName("");
  };

  useEffect(() => {
    if (!community) resetForm();
  }, [community]);

  if (!community) return null;

  return (
    <div
      className="profile-panel-overlay"
      style={{ zIndex: 1100, position: "fixed", inset: 0 }}
      onClick={onClose}
    >
      <div
        className="profile-panel-modal"
        style={{ zIndex: 1200, position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <div>
            <h1 className="panel-title">Join {community.name}</h1>
            <p className="panel-subtitle">
              Join this community using one of your identifiers
            </p>
          </div>
          <Button className="close-button" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>
        <div className="panel-content">
          <div className="form-section">
            <h3 className="section-title">Instructions</h3>
            <p className="section-description">
              {community.identifier_format_instruction}
            </p>

            {community.invite_link && (
              <div className="invite-link-section">
                <h4 className="invite-link-label">Invite Link:</h4>
                <a
                  href={community.invite_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="invite-link"
                >
                  {community.invite_link}
                </a>
              </div>
            )}
          </div>

          <div className="form-section">
            <h3 className="section-title">Choose Identifier</h3>
            <div className="form-group">
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="identifierType"
                    value="existing"
                    checked={identifierType === "existing"}
                    onChange={(e) => setIdentifierType(e.target.value)}
                    className="radio-input"
                  />
                  <span className="radio-text">
                    Use my existing identifiers (from profile setup)
                  </span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="identifierType"
                    value="custom"
                    checked={identifierType === "custom"}
                    onChange={(e) => setIdentifierType(e.target.value)}
                    className="radio-input"
                  />
                  <span className="radio-text">
                    Add a new custom identifier
                  </span>
                </label>
              </div>
            </div>

            {identifierType === "custom" && (
              <div className="form-section">
                <h3 className="section-title">Custom Identifier Details</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Identifier Label</label>
                    <Input
                      placeholder="e.g., 'discord_username', 'work_email'"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      required
                      className="form-input"
                    />
                    <p className="input-hint">
                      A name to identify this type of contact information
                    </p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Identifier Value</label>
                    <Input
                      placeholder="Enter the identifier value"
                      value={customIdentifier}
                      onChange={(e) => setCustomIdentifier(e.target.value)}
                      required
                      className="form-input"
                    />
                    <p className="input-hint">
                      The actual value of this identifier
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <Button
                onClick={handleAddIdentifier}
                className="action-button primary"
                disabled={
                  identifierType === "custom" &&
                  (!customIdentifier || !customName)
                }
              >
                {identifierType === "custom"
                  ? "Add Identifier & Join"
                  : "Continue to Join"}
              </Button>
              <Button onClick={onClose} className="action-button">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* ConfirmDialog for join request */}
      <ConfirmDialog
        open={showDialog}
        title={
          identifierType === "custom" ? "Add New Identifier" : "Join Community"
        }
        description={
          identifierType === "custom"
            ? "This will add a new identifier to your profile that you can use for this and other communities."
            : "You can join this community using your existing identifiers. Follow any invite links or instructions provided by the community."
        }
        onCancel={() => {
          setShowDialog(false);
          setLoading(false);
        }}
        onConfirm={confirmAddIdentifier}
        confirmText={
          identifierType === "custom" ? "Add Identifier" : "Understood"
        }
        cancelText="Cancel"
        loading={loading}
        style={{ zIndex: 1300 }} // Ensure ConfirmDialog is above everything
      />
    </div>
  );
};

export default JoinCommunityPanel;
