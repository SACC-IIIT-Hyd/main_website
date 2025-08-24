import React from "react";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";

const JoinCommunityPanel = ({
  community,
  userProfile,
  onClose,
}) => {

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
            <h3 className="section-title"> Join Instruction</h3>
            <p className="section-description">
              {community.identifier_format_instruction}
            </p>

            {community.invite_link && (
              <div className="invite-link-section" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h4 className="invite-link-label" style={{ marginBottom: 0 }}>Invite Link:</h4>
                <a
                  href={community.invite_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="invite-link"
                  style={{ wordBreak: 'break-all' }}
                >
                  {community.invite_link}
                </a>
                <Button
                  type="button"
                  aria-label="Copy invite link"
                  className="copy-link-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(community.invite_link);
                    toast.success("Invite link copied to clipboard!");
                  }}
                >
                  <Copy size={18} />
                </Button>
              </div>
            )}
          </div>

          <div className="form-section join-process-section">
            <h3 className="section-title process-title">How to Join This Community</h3>
            <div className="process-container">
              <div className="process-timeline">
                <div className="timeline-step">
                  <div className="step-indicator">
                    <div className="step-number">1</div>
                    <div className="step-connector"></div>
                  </div>
                  <div className="step-content">
                    <h4 className="step-title">Use the Invite Link</h4>
                    <p className="step-description">
                      Click on the invite link provided above to request joining the community on their platform (e.g., WhatsApp, Discord, Telegram, etc.).
                    </p>
                  </div>
                </div>

                <div className="timeline-step">
                  <div className="step-indicator">
                    <div className="step-number">2</div>
                    <div className="step-connector"></div>
                  </div>
                  <div className="step-content">
                    <h4 className="step-title">Admin Verification</h4>
                    <p className="step-description">
                      The community admin will use this alumni portal to verify your details. They will cross-reference your information with our alumni database.
                    </p>
                  </div>
                </div>

                <div className="timeline-step">
                  <div className="step-indicator">
                    <div className="step-number">3</div>
                    <div className="step-connector"></div>
                  </div>
                  <div className="step-content">
                    <h4 className="step-title">Secure Identity Matching</h4>
                    <p className="step-description">
                      Our system will securely compare the hash of your contact details with the identifiers in your profile to confirm your alumni status while protecting your privacy.
                    </p>
                  </div>
                </div>

                <div className="timeline-step final-step">
                  <div className="step-indicator">
                    <div className="step-number">4</div>
                  </div>
                  <div className="step-content">
                    <h4 className="step-title">Access Granted</h4>
                    <p className="step-description">
                      Once verification is complete, the admin will approve your request and you'll be welcomed into the community!
                    </p>
                  </div>
                </div>
              </div>

              <div className="verification-notice">
                <div className="notice-header">
                  <AlertCircle className="notice-icon" size={24} />
                  <h4 className="notice-title">Important Verification Requirements</h4>
                </div>
                <div className="notice-body">
                  <p className="notice-description">
                    <strong>Ensure your profile is complete:</strong> Make sure your profile identifiers are accurate and up-to-date. Only exact-match information will be considered for verification.
                  </p>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <Button onClick={onClose} className="action-button primary">
                Got It
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinCommunityPanel;
