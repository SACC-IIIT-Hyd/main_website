import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, X } from 'lucide-react';
import '@/styles/CommunityAdminPanel.scss';

const CommunityAdminPanel = ({ onClose }) => {
  const [adminCommunities, setAdminCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminCommunities();
  }, []);

  const fetchAdminCommunities = async () => {
    try {
      const response = await fetch('/api/connect/admin/communities', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAdminCommunities(data);
      }
    } catch (error) {
      console.error('Error fetching admin communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommunitySelect = (community) => {
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
            {/* Community management details would go here */}
            <div className="form-section">
              <h3 className="section-title">Community Details</h3>
              <p className="section-description">
                Manage community settings, verify join requests, and monitor activity.
              </p>
              <div className="community-card" style={{ cursor: 'default' }}>
                <div className="card-header">
                  <div className="community-info">
                    <span className="community-icon">
                      {selectedCommunity.icon || '🌐'}
                    </span>
                    <h3 className="community-name">{selectedCommunity.name}</h3>
                  </div>
                </div>
                <div className="card-content">
                  <p className="community-description">
                    {selectedCommunity.description}
                  </p>
                  <div className="community-meta">
                    <span className="platform-badge">
                      {selectedCommunity.platform_type}
                    </span>
                    <span className="member-count">
                      <Users className="icon" />
                      {selectedCommunity.member_count} members
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-alert info">
              <div className="alert-content">
                <h4 className="alert-title">Community Management Features</h4>
                <p className="alert-message">
                  Full community management features are coming soon. You'll be able to verify join requests,
                  manage member roles, and update community settings from this panel.
                </p>
              </div>
            </div>
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
                          {community.icon || '🌐'}
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
                  <div className="empty-icon">🏛️</div>
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

export default CommunityAdminPanel;