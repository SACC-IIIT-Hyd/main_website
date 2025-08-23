import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Trash2, Plus } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

import "@/styles/ProfilePanel.scss";

const ProfilePanel = ({ userProfile, onDeleteIdentifier, onClose }) => {
  const [showConfirm, setShowConfirm] = useState(null);

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

  return (
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
                    onClick={() => setShowConfirm(idx)}
                    className="delete-identifier-btn"
                  >
                    <Trash2 size={16} />
                  </Button>
                </li>
              ))}
            </ul>
          )}

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
        </div>
      </div>
    </div>
  );
};

export default ProfilePanel;
