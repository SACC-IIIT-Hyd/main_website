import React, { useState, useEffect } from 'react';
// Simple ConfirmDialog component
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
import { Toaster, toast } from 'sonner';
import NavbarComponent from '@/components/navbar';
import SuperAdminPanel from '@/components/SuperAdminPanel';
import CommunityAdminPanel from '@/components/CommunityAdminPanel';
import ProfilePanel from '@/components/ProfilePanel';
import Bottom from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, Filter, Plus, Settings, Users } from 'lucide-react';
import '@/styles/connect.scss';

const ConnectPage = () => {
  const [communities, setCommunities] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [userRoles, setUserRoles] = useState({ is_super_admin: false, is_community_admin: false });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileData, setProfileData] = useState({
    identifiers: [
      { label: 'personal_email', value: '' },
      { label: 'phone_number', value: '' }
    ]
  });
  const [showSuperAdminPanel, setShowSuperAdminPanel] = useState(false);
  const [showCommunityAdminPanel, setShowCommunityAdminPanel] = useState(false);
  const [showJoinCommunityPanel, setShowJoinCommunityPanel] = useState(null); // holds the community object
  const [showProfilePanel, setShowProfilePanel] = useState(false);

  // Delete identifier handler
  const handleDeleteIdentifier = async (identifierId) => {
    try {
      const response = await fetch(`/api/connect/profile/identifiers/${identifierId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        toast.success('Identifier deleted successfully');
        fetchUserProfile();
      } else {
        const error = await response.json();
        toast.error(`Failed to delete identifier: ${error.detail || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('Error deleting identifier:', e);
      toast.error('Error deleting identifier');
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchUserRoles();
    fetchCommunities();
  }, []);

  const fetchUserProfile = async () => {
    try {
      console.log('Debug: Fetching user profile...');
      const response = await fetch('/api/connect/profile', {
        credentials: 'include'
      });
      console.log('Debug: Fetching user profile response', response);

      if (response.ok) {
        const data = await response.json();
        console.log('Debug: Profile data:', data);
        setUserProfile(data);
        setShowProfileSetup(false);
      } else if (response.status === 404) {
        console.log('Debug: Profile not found, showing setup');
        setUserProfile(null);
        setShowProfileSetup(true);
      } else {
        console.error('Debug: Error fetching profile:', response.status);
        toast.error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const response = await fetch('/api/connect/user-roles', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUserRoles(data);
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }
  };

  const fetchCommunities = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (platformFilter) params.append('platform_type', platformFilter);
      if (tagFilter) params.append('tag', tagFilter);

      const response = await fetch(`/api/connect/communities?${params}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCommunities(data);
      } else {
        toast.error('Failed to fetch communities');
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast.error('Failed to fetch communities');
    }
  };

  const handleProfileSetup = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/connect/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        setShowProfileSetup(false);
        toast.success('Profile setup completed successfully!');
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.detail || 'Failed to setup profile'}`);
      }
    } catch (error) {
      console.error('Error setting up profile:', error);
      toast.error('Failed to setup profile');
    }
  };

  // Helper function to get platform icons
  const getPlatformIcon = (platform) => {
    const iconMap = {
      discord: '🎮',
      whatsapp: '💬',
      facebook: '📘',
      teams: '🏢',
      slack: '💼',
      telegram: '✈️',
      linkedin: '💼',
      other: '🌐'
    };
    return iconMap[platform] || '🌐';
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="connect-page">
        <NavbarComponent isSticky={true} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-text">Loading...</div>
          </div>
        </div>
        <Bottom />
      </div>
    );
  }

  if (showProfileSetup) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <div className="connect-page">
          <NavbarComponent isSticky={true} />
          <div className="main-content">
            {/* Profile Setup Card */}
            <div className="profile-setup-containerr">
              <Card className="setup-card">
                <CardHeader className="setup-header">
                  <CardTitle className="card-title">Welcome to Connect!</CardTitle>
                  <CardDescription className="card-description">
                    To get started, please provide your personal contact information for verification purposes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSetup} className="setup-form space-y-6">
                    <div className="privacy-notice">
                      <p className="">
                        <strong>Privacy Notice:</strong> Your personal email and phone number will be hashed and stored securely.<br />
                        Even we cannot retrieve your original information. <br />This is only used to verify the authenticity of community join requests.
                      </p>
                    </div>

                    <div className="form-group">
                      <label className="form-label block mb-1 font-medium">Personal Email Address</label>
                      <Input
                        type="email"
                        value={profileData.identifiers[0]?.value || ''}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          identifiers: prev.identifiers.map((id, index) =>
                            index === 0 ? { ...id, value: e.target.value } : id
                          )
                        }))}
                        placeholder="your.personal@email.com"
                        required
                        className="form-input w-full"
                      />
                    </div>

                    <div className="form-group mb-6">
                      <label className="form-label block mb-1 font-medium">Phone Number</label>
                      <Input
                        type="tel"
                        value={profileData.identifiers[1]?.value || ''}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          identifiers: prev.identifiers.map((id, index) =>
                            index === 1 ? { ...id, value: e.target.value } : id
                          )
                        }))}
                        placeholder="+91 98765 43210"
                        required
                        className="form-input w-full"
                      />
                    </div>

                    <Button type="submit" className="setup-button w-full">
                      Complete Setup
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
          <Bottom />
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="connect-page">
        <NavbarComponent isSticky={true} />

        <div className="main-content">
          {/* Header */}
          <div className="header-container">
            <div className="header-title">
              <h1 className="title">Alumni Communities</h1>
              <p className="subtitle">Connect with fellow IIITH alumni across various platforms</p>
            </div>
          </div>

          {/* Admin & Profile Buttons */}
          <div className="admin-buttons-row">
            <Button
              className="admin-btn profile-btn"
              onClick={() => setShowProfilePanel(true)}
              title="Profile Panel"
            >
              <Users className="icon" />
              <span className="btn-text">My Profile</span>
            </Button>
            {userRoles.is_community_admin && (
              <Button
                className="admin-btn community-admin-btn"
                onClick={() => setShowCommunityAdminPanel(true)}
                title="Community Admin Panel"
              >
                <Settings className="icon" />
                <span className="btn-text">Community Admin</span>
              </Button>
            )}
            {userRoles.is_super_admin && (
              <Button
                className="admin-btn super-admin-btn"
                onClick={() => setShowSuperAdminPanel(true)}
                title="Super Admin Panel"
              >
                <Plus className="icon" />
                <span className="btn-text">Super Admin</span>
              </Button>
            )}
          </div>
          {/* Profile Panel Overlay */}
          {showProfilePanel && (
            <ProfilePanel
              userProfile={userProfile}
              onDeleteIdentifier={handleDeleteIdentifier}
              onClose={() => setShowProfilePanel(false)}
            />
          )}



          {/* Search and Filters */}
          <div className="search-filter-container">
            <div className="search-bar">
              <Search className="search-icon" />
              <Input
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="platform-filter"
            >
              <option value="">All Platforms</option>
              <option value="discord">Discord</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="facebook">Facebook</option>
              <option value="teams">Teams</option>
              <option value="slack">Slack</option>
              <option value="telegram">Telegram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="other">Other</option>
            </select>

            <Input
              placeholder="Filter by tag..."
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="tag-filter"
            />

            <Button onClick={fetchCommunities} variant="outline" className="apply-filters-button">
              <Filter className="icon" />
              Apply Filters
            </Button>
          </div>

          {/* Communities List */}
          <div className="communities-list">
            <Accordion type="single" collapsible className="accordion">
              {communities.map((community) => (
                <AccordionItem key={community.id} value={community.id.toString()}>
                  <AccordionTrigger className="accordion-trigger">
                    <Card className="community-card">
                      <CardContent className="community-card-content">
                        <div className="community-card-inner">
                          <div className="community-info">
                            <div className="platform-icon">
                              {community.icon || getPlatformIcon(community.platform_type)}
                            </div>
                            <div className="community-details">
                              <h3 className="community-name">{community.name}</h3>
                              <p className="community-description">
                                {truncateText(community.description, 100)}
                              </p>
                              <div className="community-meta">
                                <Badge variant="secondary" className="platform-badge">{community.platform_type}</Badge>
                                <div className="member-count">
                                  <Users className="icon" />
                                  {community.member_count} members
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="tags-container">
                            {community.tags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="tag-badge">
                                {tag}
                              </Badge>
                            ))}
                            {community.tags.length > 3 && (
                              <Badge variant="outline" className="tag-badge">
                                +{community.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </AccordionTrigger>

                  <AccordionContent>
                    <Card className="community-details-card">
                      <CardContent className="community-details-content">
                        <div className="details-section">
                          <div className="section-header">
                            <h4 className="section-title">Full Description</h4>
                          </div>
                          <div className="section-content">
                            <p className="description-text">{community.description}</p>
                          </div>
                        </div>

                        <div className="platform-members-grid">
                          <div className="detail-item">
                            <h4>Platform</h4>
                            <div className="detail-content">
                              <span className="icon">{getPlatformIcon(community.platform_type)}</span>
                              <span className="platform-text">{community.platform_type}</span>
                            </div>
                          </div>

                          <div className="detail-item">
                            <h4>Members</h4>
                            <div className="detail-content">
                              <Users className="icon" />
                              <span>{community.member_count} members</span>
                            </div>
                          </div>
                        </div>

                        {community.tags.length > 0 && (
                          <div className="tags-section">
                            <h4>Tags</h4>
                            <div className="tags-grid">
                              {community.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="tag-badge">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="join-section">
                          <Button
                            className="w-full join-community-btn"
                            disabled={community.join_request_exists}
                            onClick={() => setShowJoinCommunityPanel(community)}
                          >
                            {community.join_request_exists ? 'Request Pending' : 'Join Community'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {communities.length === 0 && (
              <div className="no-communities">
                <div className="no-communities-text">No communities found</div>
                <p className="no-communities-subtext">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {showJoinCommunityPanel && (
            <JoinCommunityPanel
              community={showJoinCommunityPanel}
              userProfile={userProfile}
              onClose={() => setShowJoinCommunityPanel(null)}
              onJoinSuccess={() => {
                setShowJoinCommunityPanel(null);
                fetchCommunities();
              }}
            />
          )}
        </div>
        <Bottom />
      </div>

      {/* Admin Panel Overlays */}
      {showSuperAdminPanel && (
        <div className="admin-panel-overlay">
          <SuperAdminPanel onClose={() => setShowSuperAdminPanel(false)} />
        </div>
      )}

      {showCommunityAdminPanel && (
        <div className="admin-panel-overlay">
          <CommunityAdminPanel onClose={() => setShowCommunityAdminPanel(false)} />
        </div>
      )}
    </>
  );
};

// Join Community Panel Component (modal style)
const JoinCommunityPanel = ({ community, userProfile, onClose, onJoinSuccess }) => {
  const [identifierType, setIdentifierType] = useState('existing');
  const [customIdentifier, setCustomIdentifier] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);

  console.log('Debug: JoinCommunityPanel userProfile:', userProfile);

  // If userProfile is null, show a message instead of the join form
  if (!userProfile) {
    return (
      <div className="drawer-overlay" onClick={onClose}>
        <div className="drawer-modal" onClick={e => e.stopPropagation()}>
          <div className="drawer-header">
            <h2 className="drawer-title">Profile Setup Required</h2>
            <p className="drawer-description">You need to complete your profile setup before joining communities</p>
          </div>
          <div className="drawer-content">
            <div className="p-4 pb-6 space-y-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Profile Not Found</h4>
                <p className="text-sm text-red-800">
                  Your profile setup was not completed properly. Please refresh the page and complete your profile setup again.
                </p>
              </div>

              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>
            <div className="drawer-actions">
              <Button onClick={onClose} className="btn-cancel">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dialog state for join request
  const [showDialog, setShowDialog] = useState(false);

  const handleAddIdentifier = async () => {
    if (identifierType === 'custom' && (!customIdentifier || !customName)) {
      toast.error('Please fill in all custom identifier fields');
      return;
    }
    setShowDialog(true);
  };

  const confirmAddIdentifier = async () => {
    setLoading(true);
    try {
      if (identifierType === 'custom') {
        const requestData = {
          label: customName,
          value: customIdentifier
        };

        const response = await fetch('/api/connect/profile/identifiers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(requestData)
        });

        if (response.ok) {
          toast.success('Identifier added successfully! You can now join this community using this identifier.');
          setShowDialog(false);
          onJoinSuccess();
        } else {
          const error = await response.json();
          toast.error(`Error: ${error.detail || 'Failed to add identifier'}`);
        }
      } else {
        // For existing identifiers, just show success message
        toast.success(`You can join this community using your existing ${identifierType}. Please follow the invite link or instructions provided.`);
        setShowDialog(false);
        onJoinSuccess();
      }
    } catch (error) {
      console.error('Error adding identifier:', error);
      toast.error('Failed to add identifier. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIdentifierType('existing');
    setCustomIdentifier('');
    setCustomName('');
  };

  useEffect(() => {
    if (!community) resetForm();
  }, [community]);

  if (!community) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-modal" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <h2 className="drawer-title">Join {community.name}</h2>
          <p className="drawer-description">Join this community using one of your identifiers</p>
        </div>
        <div className="drawer-content">
          <div className="p-4 pb-6 space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
              <p className="text-sm text-blue-800">{community.identifier_format_instruction}</p>
            </div>

            {community.invite_link && (
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Invite Link:</h4>
                <a
                  href={community.invite_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-800 underline hover:no-underline"
                >
                  {community.invite_link}
                </a>
              </div>
            )}

            <>
              <div>
                <label className="block text-sm font-medium mb-2">Choose Identifier</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="identifierType"
                      value="existing"
                      checked={identifierType === 'existing'}
                      onChange={e => setIdentifierType(e.target.value)}
                      className="mr-2"
                    />
                    Use my existing identifiers (from profile setup)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="identifierType"
                      value="custom"
                      checked={identifierType === 'custom'}
                      onChange={e => setIdentifierType(e.target.value)}
                      className="mr-2"
                    />
                    Add a new custom identifier
                  </label>
                </div>
              </div>

              {identifierType === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Identifier Label</label>
                    <Input
                      placeholder="e.g., 'discord_username', 'work_email'"
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      required
                      className="custom-identifier-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Identifier Value</label>
                    <Input
                      placeholder="Enter the identifier value"
                      value={customIdentifier}
                      onChange={e => setCustomIdentifier(e.target.value)}
                      required
                      className="custom-identifier-input"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleAddIdentifier}
                className="w-full"
                disabled={identifierType === 'custom' && (!customIdentifier || !customName)}
              >
                {identifierType === 'custom' ? 'Add Identifier & Join' : 'Continue to Join'}
              </Button>
              {/* ConfirmDialog for join request */}
              <ConfirmDialog
                open={showDialog}
                title={identifierType === 'custom' ? 'Add New Identifier' : 'Join Community'}
                description={
                  identifierType === 'custom'
                    ? 'This will add a new identifier to your profile that you can use for this and other communities.'
                    : 'You can join this community using your existing identifiers. Follow any invite links or instructions provided by the community.'
                }
                onCancel={() => { setShowDialog(false); setLoading(false); }}
                onConfirm={confirmAddIdentifier}
                confirmText={identifierType === 'custom' ? 'Add Identifier' : 'Understood'}
                cancelText="Cancel"
                loading={loading}
              />
            </>
          </div>
          <div className="drawer-actions">
            <Button onClick={onClose} className="btn-cancel">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectPage;
