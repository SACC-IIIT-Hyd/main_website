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
  const [newIdentifier, setNewIdentifier] = useState({
    label: "",
    value: ""
  });

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

  const handleAddIdentifier = async (e) => {
    e.preventDefault();
    if (!newIdentifier.label.trim() || !newIdentifier.value.trim()) {
      return;
    }

    await onAddIdentifier(newIdentifier);
    setNewIdentifier({ label: "", value: "" });
    setShowAddForm(false);
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
                  <div className="form-fields">
                    <Input
                      type="text"
                      placeholder="Identifier type (e.g., personal_email, phone_number)"
                      value={newIdentifier.label}
                      onChange={(e) => setNewIdentifier(prev => ({ ...prev, label: e.target.value }))}
                      required
                      className="identifier-label-input"
                    />
                    <Input
                      type="text"
                      placeholder="Identifier value"
                      value={newIdentifier.value}
                      onChange={(e) => setNewIdentifier(prev => ({ ...prev, value: e.target.value }))}
                      required
                      className="identifier-value-input"
                    />
                  </div>
                  <div className="form-actions">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewIdentifier({ label: "", value: "" });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm">
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
