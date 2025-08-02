import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, X, Search, CheckCircle, XCircle, Edit, Save, Upload, Globe } from 'lucide-react';
import '@/styles/CommunityAdminPanel.scss';
import { Toaster, toast } from 'sonner';

const ConfirmDialog = ({ open, title, description, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', loading }) => {
  if (!open) return null;
  return (
    <div className="dialog-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000 }}>
      <div className="dialog-modal" style={{ background: 'white', maxWidth: 400, margin: '10% auto', borderRadius: 8, boxShadow: '0 2px 16px rgba(0,0,0,0.2)', padding: 24 }}>
        <h3 style={{ fontWeight: 600, fontSize: 20, marginBottom: 8 }}>{title}</h3>
        <div style={{ marginBottom: 24 }}>{description}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onCancel} className="confirm-dialog-button">{cancelText}</Button>
          <Button onClick={onConfirm} disabled={loading} className="confirm-dialog-button">{loading ? 'Submitting...' : confirmText}</Button>
        </div>
      </div>
    </div>
  );
};

const CommunityAdminPanel = ({ onClose }) => {
  const [adminCommunities, setAdminCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminCommunities();
  }, []);

  const fetchAdminCommunities = async () => {
    try {
      const response = await fetch('/api/connect/user-roles', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.admin_communities && data.admin_communities.length > 0) {
          // Fetch community details for each admin community
          const communityPromises = data.admin_communities.map(async (communityId) => {
            const communityResponse = await fetch(`/api/connect/communities/${communityId}`, {
              credentials: 'include'
            });
            if (communityResponse.ok) {
              return await communityResponse.json();
            }
            return null;
          });

          const communities = await Promise.all(communityPromises);
          setAdminCommunities(communities.filter(c => c !== null));
        } else {
          setAdminCommunities([]);
        }
      } else {
        toast.error('Failed to fetch admin communities');
      }
    } catch (error) {
      console.error('Error fetching admin communities:', error);
      toast.error('Failed to fetch admin communities');
    } finally {
      setLoading(false);
    }
  }; const handleCommunitySelect = (community) => {
    setSelectedCommunity(community);
  };

  const handleBackToList = () => {
    setSelectedCommunity(null);
  };

  if (selectedCommunity) {
    return (
      <div className="community-admin-panel">
        <div className="panel-container">
          <div className="panel-header">
            <div>
              <h1 className="panel-title">Manage {selectedCommunity.name}</h1>
              <p className="panel-subtitle">Community Administration</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Button
                className="close-button"
                onClick={handleBackToList}
                style={{
                  background: 'rgba(143, 90, 51, 0.2)',
                  borderColor: 'rgba(143, 90, 51, 0.5)',
                  color: '#EFDFC2'
                }}
              >
                Back to List
              </Button>
              <Button className="close-button" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>
          </div>
          <div className="panel-content">
            <CommunityManagement community={selectedCommunity} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="community-admin-panel">
      <div className="panel-container">
        <div className="panel-header">
          <div>
            <h1 className="panel-title">Community Admin Panel</h1>
            <p className="panel-subtitle">Manage your assigned communities</p>
          </div>
          <Button className="close-button" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="panel-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <span className="loading-text">Loading your communities...</span>
            </div>
          ) : (
            <>
              <p className="panel-description">
                Select a community to manage its details and verify join requests.
              </p>

              <div className="communities-grid">
                {adminCommunities.map((community) => (
                  <div
                    key={community.id}
                    className="community-card"
                    onClick={() => handleCommunitySelect(community)}
                  >
                    <div className="card-header">
                      <div className="community-info">
                        <span className="community-icon">
                          {community.icon || <Globe size={24} />}
                        </span>
                        <h3 className="community-name">{community.name}</h3>
                      </div>
                    </div>

                    <div className="card-content">
                      <p className="community-description">
                        {community.description.length > 80
                          ? community.description.substring(0, 80) + '...'
                          : community.description
                        }
                      </p>

                      <div className="community-meta">
                        <span className="platform-badge">
                          {community.platform_type}
                        </span>
                        <span className="member-count">
                          <Users className="icon" />
                          {community.member_count}
                        </span>
                      </div>

                      <button className="manage-button">
                        Manage Community
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {adminCommunities.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon"><Building2 size={48} /></div>
                  <h3 className="empty-title">No Communities Assigned</h3>
                  <p className="empty-subtitle">
                    Contact a super admin to get community admin access for specific communities.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Community Management Component
const CommunityManagement = ({ community }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: community.name,
    description: community.description,
    tags: community.tags.join(', '),
    member_count: community.member_count,
    invite_link: community.invite_link || '',
    identifier_format_instruction: community.identifier_format_instruction,
    icon: community.icon || ''
  });
  const [identifierValue, setIdentifierValue] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const handleUpdate = async () => {
    setUpdateLoading(true);
    try {
      const updatePayload = {
        ...editData,
        tags: editData.tags ? editData.tags.split(',').map(tag => tag.trim()) : [],
        member_count: parseInt(editData.member_count) || 0
      };

      const response = await fetch(`/api/connect/communities/${community.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatePayload)
      });

      if (response.ok) {
        toast.success('Community updated successfully!');
        setIsEditing(false);
        // Update the community object (would need to be passed up to parent)
        Object.assign(community, await response.json());
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error || error.detail || 'Failed to update community'}`);
      }
    } catch (error) {
      console.error('Error updating community:', error);
      toast.error('Failed to update community. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleVerifyIdentifier = async () => {
    if (!identifierValue.trim()) {
      toast.error('Please enter an identifier to verify');
      return;
    }

    setVerificationLoading(true);
    try {
      const response = await fetch(`/api/connect/verify-identifier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ identifier: identifierValue.trim() })
      });

      if (response.ok) {
        const result = await response.json();
        setVerificationResult(result);
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error || error.detail || 'Failed to verify identifier'}`);
      }
    } catch (error) {
      console.error('Error verifying identifier:', error);
      toast.error('Failed to verify identifier. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <div className="community-management">
      {/* Identifier Verification Section */}
      <div className="form-section">
        <h3 className="section-title">Verify Join Request</h3>
        <p className="section-description">
          Enter an identifier to check if any alumnus has applied to join this community with that identifier.
        </p>

        <div className="verification-form">
          <div className="input-group">
            <Input
              value={identifierValue}
              onChange={(e) => setIdentifierValue(e.target.value)}
              placeholder="Enter identifier to verify (email, phone, etc.)"
              className="verification-input"
            />
            <Button
              onClick={handleVerifyIdentifier}
              disabled={verificationLoading}
              className="verify-button"
            >
              <Search className="icon" />
              {verificationLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </div>

          {verificationResult && (
            <div className={`verification-result ${verificationResult.found ? 'found' : 'not-found'}`}>
              {verificationResult.found ? (
                <div className="result-content">
                  <CheckCircle className="result-icon success" />
                  <div className="result-details">
                    <h4>Request Found!</h4>
                    <p>A person with the identifier <strong>{identifierValue}</strong> has requested to join this community.</p>
                  </div>
                </div>
              ) : (
                <div className="result-content">
                  <XCircle className="result-icon error" />
                  <div className="result-details">
                    <h4>No Request Found</h4>
                    <p>No join request found with the provided identifier for this community.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Community Details Section */}
      <div className="form-section">
        <div className="section-header">
          <h3 className="section-title">Community Details</h3>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="outline"
            className="edit-button"
          >
            <Edit className="icon" />
            {isEditing ? 'Cancel Edit' : 'Edit Details'}
          </Button>
        </div>

        {isEditing ? (
          <div className="edit-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Community Name</label>
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Member Count</label>
                <Input
                  type="number"
                  value={editData.member_count}
                  onChange={(e) => setEditData(prev => ({ ...prev, member_count: e.target.value }))}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <Input
                value={editData.tags}
                onChange={(e) => setEditData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="alumni, tech, social"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Invite Link</label>
              <Input
                value={editData.invite_link}
                onChange={(e) => setEditData(prev => ({ ...prev, invite_link: e.target.value }))}
                placeholder="https://discord.gg/..."
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Join Instructions</label>
              <textarea
                value={editData.identifier_format_instruction}
                onChange={(e) => setEditData(prev => ({ ...prev, identifier_format_instruction: e.target.value }))}
                className="form-textarea"
                rows={3}
                placeholder="Instructions for users on how to format their identifier..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Icon</label>
              <Input
                value={editData.icon}
                onChange={(e) => setEditData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="🌐 (emoji or leave blank for default)"
                className="form-input"
              />
            </div>

            <div className="form-actions">
              <Button
                onClick={handleUpdate}
                disabled={updateLoading}
                className="save-button"
              >
                <Save className="icon" />
                {updateLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="community-display">
            <div className="community-card" style={{ cursor: 'default' }}>
              <div className="card-header">
                <div className="community-info">
                  <span className="community-icon">
                    {community.icon || '🌐'}
                  </span>
                  <h3 className="community-name">{community.name}</h3>
                </div>
              </div>
              <div className="card-content">
                <p className="community-description">
                  {community.description}
                </p>
                <div className="community-meta">
                  <span className="platform-badge">
                    {community.platform_type}
                  </span>
                  <span className="member-count">
                    <Users className="icon" />
                    {community.member_count} members
                  </span>
                </div>
                {community.tags && community.tags.length > 0 && (
                  <div className="tags-container">
                    {community.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="tag-badge">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {community.invite_link && (
                  <div className="invite-link">
                    <strong>Invite Link:</strong>
                    <a href={community.invite_link} target="_blank" rel="noopener noreferrer">
                      {community.invite_link}
                    </a>
                  </div>
                )}
                <div className="instructions-section">
                  <strong>Join Instructions:</strong>
                  <p>{community.identifier_format_instruction}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityAdminPanel;