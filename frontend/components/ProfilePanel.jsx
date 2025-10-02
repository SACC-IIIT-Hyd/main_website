import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Trash2, Plus } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

import "@/styles/ProfilePanel.scss";

const ProfilePanel = ({ userProfile, onDeleteIdentifier, onAddIdentifier, onClose }) => {
  const [showConfirm, setShowConfirm] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [identifierType, setIdentifierType] = useState("");
  const [identifierLabel, setIdentifierLabel] = useState("");
  const [phoneDigits, setPhoneDigits] = useState(new Array(12).fill(""));
  const [emailValue, setEmailValue] = useState("");
  const [usernameValue, setUsernameValue] = useState("");
  const [emailError, setEmailError] = useState("");

  // Build identifiers list from the new backend structure
  const identifiers = [];
  if (userProfile?.identifiers && Array.isArray(userProfile.identifiers)) {
    userProfile.identifiers.forEach((identifier) => {
      identifiers.push({
        id: identifier.id,
        type: identifier.label,
        value: "Set", // We don't show actual values for security
      });
    });
  }

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle phone digit input
  const handlePhoneDigitChange = (index, value) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newPhoneDigits = [...phoneDigits];
      newPhoneDigits[index] = value;
      setPhoneDigits(newPhoneDigits);

      // Auto-focus to next input if digit entered
      if (value && index < 11) {
        const nextInput = document.querySelector(`[data-phone-index="${index + 1}"]`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  // Handle backspace in phone inputs
  const handlePhoneKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !phoneDigits[index] && index > 0) {
      const prevInput = document.querySelector(`[data-phone-index="${index - 1}"]`);
      if (prevInput) prevInput.focus();
    }
  };

  // Reset form
  const resetForm = () => {
    setIdentifierType("");
    setIdentifierLabel("");
    setPhoneDigits(new Array(12).fill(""));
    setEmailValue("");
    setUsernameValue("");
    setEmailError("");
    setShowAddForm(false);
  };

  const handleAddIdentifier = async (e) => {
    e.preventDefault();

    if (!identifierLabel.trim()) {
      return; // Don't submit if label is empty
    }

    let value = "";

    if (identifierType === "phone") {
      // Check if all phone digits are filled
      if (phoneDigits.some(digit => digit === "")) {
        return; // Don't submit if any digit is missing
      }
      value = phoneDigits.join("");
    } else if (identifierType === "email") {
      if (!validateEmail(emailValue)) {
        setEmailError("Please enter a valid email address");
        return;
      }
      value = emailValue;
    } else if (identifierType === "username") {
      if (!usernameValue.trim()) {
        return;
      }
      value = usernameValue;
    }

    if (!value) return;

    await onAddIdentifier({ label: identifierLabel, value });
    resetForm();
  };

  console.log("ProfilePanel render - showConfirm:", showConfirm);

  return (
    <>
      <div className="profile-panel-overlay">
        <div className="profile-panel-modal">
          <div className="panel-header">
            <div>
              <h1 className="panel-title">My Identifiers</h1>
              <p className="panel-subtitle">Manage your personal identifiers</p>
            </div>
            <Button className="close-button" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
          <div className="panel-content">
            {identifiers.length === 0 ? (
              <div className="empty-state">No identifiers found.</div>
            ) : (
              <ul className="identifier-list">
                {identifiers.map((id, idx) => (
                  <li key={idx} className="identifier-item">
                    <span className="identifier-type">{id.type}:</span>
                    <span className="identifier-value">{id.value}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        console.log("Delete button clicked for index:", idx);
                        setShowConfirm(idx);
                      }}
                      className="delete-identifier-btn"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add Identifier Section */}
            <div className="add-identifier-section">
              {!showAddForm ? (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="add-identifier-btn"
                  variant="outline"
                >
                  <Plus size={16} />
                  Add New Identifier
                </Button>
              ) : (
                <form onSubmit={handleAddIdentifier} className="add-identifier-form">
                  {/* Identifier Type Dropdown */}
                  <div className="form-field">
                    <label className="form-label">Identifier Type</label>
                    <select
                      value={identifierType}
                      onChange={(e) => setIdentifierType(e.target.value)}
                      required
                      className="identifier-type-select"
                    >
                      <option value="">Select type...</option>
                      <option value="phone">Phone Number</option>
                      <option value="email">Email Address</option>
                      <option value="username">Username/Other</option>
                    </select>
                  </div>

                  {/* Identifier Label Input */}
                  {identifierType && (
                    <div className="form-field">
                      <label className="form-label">Label/Name for this identifier</label>
                      <Input
                        type="text"
                        placeholder="e.g., Personal, Primary, Work, etc."
                        value={identifierLabel}
                        onChange={(e) => setIdentifierLabel(e.target.value)}
                        required
                        className="identifier-label-input"
                      />
                    </div>
                  )}

                  {/* Phone Number Input */}
                  {identifierType === "phone" && (
                    <div className="form-field">
                      <label className="form-label">Phone Number (with country code)</label>
                      <div className="phone-input-container">
                        {phoneDigits.map((digit, index) => (
                          <input
                            key={index}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handlePhoneDigitChange(index, e.target.value)}
                            onKeyDown={(e) => handlePhoneKeyDown(index, e)}
                            data-phone-index={index}
                            className="phone-digit-input"
                            placeholder="0"
                          />
                        ))}
                      </div>
                      <p className="phone-help-text">Enter 12 digits including country code (e.g., +91 9876543210)</p>
                    </div>
                  )}

                  {/* Email Input */}
                  {identifierType === "email" && (
                    <div className="form-field">
                      <label className="form-label">Email Address</label>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        value={emailValue}
                        onChange={(e) => {
                          setEmailValue(e.target.value);
                          setEmailError("");
                        }}
                        required
                        className="identifier-value-input"
                      />
                      {emailError && <p className="error-text">{emailError}</p>}
                    </div>
                  )}

                  {/* Username/Other Input */}
                  {identifierType === "username" && (
                    <div className="form-field">
                      <label className="form-label">Username/Other Identifier</label>
                      <Input
                        type="text"
                        placeholder="Enter username or other identifier"
                        value={usernameValue}
                        onChange={(e) => setUsernameValue(e.target.value)}
                        required
                        className="identifier-value-input"
                      />
                    </div>
                  )}

                  <div className="form-actions">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!identifierType || !identifierLabel.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Render ConfirmDialog outside of the modal to ensure proper z-index layering */}
      {showConfirm !== null && (
        <ConfirmDialog
          open={showConfirm !== null}
          title="Delete Identifier"
          description={`Are you sure you want to delete this ${identifiers[showConfirm]?.type} identifier?`}
          onConfirm={() => {
            onDeleteIdentifier(identifiers[showConfirm].id);
            setShowConfirm(null);
          }}
          onCancel={() => setShowConfirm(null)}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </>
  );
};

export default ProfilePanel;
