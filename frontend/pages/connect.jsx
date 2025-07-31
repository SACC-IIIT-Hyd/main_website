import React, { useState, useEffect } from 'react';
import NavbarComponent from '@/components/navbar';
import SuperAdminPanel from '@/components/SuperAdminPanel';
import CommunityAdminPanel from '@/components/CommunityAdminPanel';
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
  const [profileData, setProfileData] = useState({ personal_email: '', phone_number: '' });
  const [showSuperAdminPanel, setShowSuperAdminPanel] = useState(false);
  const [showCommunityAdminPanel, setShowCommunityAdminPanel] = useState(false);
  const [showJoinCommunityPanel, setShowJoinCommunityPanel] = useState(null); // holds the community object

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
        const responseText = await response.text();
        console.log('Debug: Raw response text:', responseText);

        let profile;
        try {
          profile = responseText ? JSON.parse(responseText) : null;
        } catch (parseError) {
          console.error('Debug: JSON parse error:', parseError);
          console.error('Debug: Response text that failed to parse:', responseText);
          profile = null;
        }

        console.log('Debug: Parsed user profile', profile);
        setUserProfile(profile);

        // If profile is null, show profile setup
        if (profile === null) {
          console.log('Debug: Profile is null, showing setup');
          setShowProfileSetup(true);
        }
      } else if (response.status === 404) {
        console.log('Debug: Profile not found (404), showing setup');
        setShowProfileSetup(true);
      } else {
        console.log('Debug: Unexpected response status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const response = await fetch('/api/connect/user-roles', {
        credentials: 'include'
      });
      if (response.ok) {
        const roles = await response.json();
        setUserRoles(roles);
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }
  };

  const fetchCommunities = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (platformFilter) params.append('platform', platformFilter);
      if (tagFilter) params.append('tag', tagFilter);

      const response = await fetch(`/api/connect/communities?${params}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCommunities(data);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSetup = async (e) => {
    e.preventDefault();
    console.log('Debug: Starting profile setup with data:', profileData);

    try {
      const response = await fetch('/api/connect/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });

      console.log('Debug: Profile setup response status:', response.status);
      console.log('Debug: Profile setup response:', response);

      if (response.ok) {
        const responseText = await response.text();
        console.log('Debug: Profile setup raw response:', responseText);

        let profile;
        try {
          profile = responseText ? JSON.parse(responseText) : null;
        } catch (parseError) {
          console.error('Debug: Profile setup JSON parse error:', parseError);
          profile = null;
        }

        console.log('Debug: Profile setup parsed response:', profile);
        setUserProfile(profile);
        setShowProfileSetup(false);
        alert('Profile setup completed successfully!');

        // Refetch profile to verify it was saved
        console.log('Debug: Refetching profile after setup...');
        await fetchUserProfile();
      } else {
        const errorText = await response.text();
        console.log('Debug: Profile setup error response:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText };
        }
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error setting up profile:', error);
      alert('Failed to setup profile. Please try again.');
    }
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      discord: '💬',
      whatsapp: '💚',
      teams: '🟦',
      slack: '💼',
      telegram: '✈️',
      linkedin: '💼',
      other: '🌐'
    };
    return icons[platform] || icons.other;
  };

  const truncateText = (text, limit) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  };

  if (loading) {
    return (
      <div className="connect-page">
        <NavbarComponent isSticky={true} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (showProfileSetup && !userProfile) {
    return (
      <div className="connect-page">
        <NavbarComponent isSticky={true} />
        <div className="">
          <Card className="setup-card">
            <CardHeader className="setup-header">
              <CardTitle>Welcome to Connect!</CardTitle>
              <CardDescription>
                Discover and join IIITH alumni communities across Discord, WhatsApp, Teams, Slack, and more.
                To get started, please provide your personal contact information for verification purposes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSetup} className="setup-form">
                <div className="privacy-notice">
                  <p>
                    <strong>Privacy Notice:</strong> Your personal email and phone number will be hashed and stored securely.
                    Even we cannot retrieve your original information. This is only used to verify the authenticity of community join requests.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Personal Email Address</label>
                  <Input
                    type="email"
                    value={profileData.personal_email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, personal_email: e.target.value }))}
                    placeholder="your.personal@email.com"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <Input
                    type="tel"
                    value={profileData.phone_number}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone_number: e.target.value }))}
                    placeholder="+91 98765 43210"
                    required
                    className="form-input"
                  />
                </div>

                <Button type="submit" className="setup-button">
                  Complete Setup
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="connect-page">
      <NavbarComponent isSticky={true} />

      <div className="main-content">
        {/* Header */}
        <div className="header-container">
          <div className="header-title">
            <h1 className="title">Alumni Communities</h1>
            <p className="subtitle">Connect with fellow IIITH alumni across various platforms</p>
          </div>

          {/* Admin Buttons */}
          <div className="admin-buttons-container">
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

          {/* Admin Panels */}
          {showSuperAdminPanel && (
            <SuperAdminPanel onClose={() => setShowSuperAdminPanel(false)} />
          )}

          {showCommunityAdminPanel && (
            <CommunityAdminPanel onClose={() => setShowCommunityAdminPanel(false)} />
          )}
        </div>

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
  );
};


// Join Community Panel Component (modal style)
const JoinCommunityPanel = ({ community, userProfile, onClose, onJoinSuccess }) => {
  const [identifierType, setIdentifierType] = useState('email');
  const [customIdentifier, setCustomIdentifier] = useState('');
  const [customName, setCustomName] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
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

  const handleJoinRequest = async () => {
    console.log('Debug: Starting join request with userProfile:', userProfile);

    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        community_id: community.id,
        identifier_type: identifierType
      };

      if (identifierType === 'custom') {
        requestData.identifier_value = customIdentifier;
        requestData.identifier_name = customName;
      }

      console.log('Debug: Join request data:', requestData);

      const response = await fetch('/api/connect/join-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });

      console.log('Debug: Join request response status:', response.status);
      console.log('Debug: Join request response:', response);

      if (response.ok) {
        alert('Join request submitted successfully!');
        setShowConfirmation(false);
        onJoinSuccess();
      } else {
        const errorText = await response.text();
        console.log('Debug: Join request error response text:', errorText);

        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText };
        }

        console.log('Debug: Join request parsed error:', error);
        alert(`Error: ${error.detail || error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting join request:', error);
      alert('Failed to submit join request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIdentifierType('email');
    setCustomIdentifier('');
    setCustomName('');
    setShowConfirmation(false);
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
          <p className="drawer-description">Choose how you'd like to identify yourself for this community</p>
        </div>
        <div className="drawer-content">
          <div className="p-4 pb-6 space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
              <p className="text-sm text-blue-800">{community.identifier_format_instruction}</p>
            </div>

            {!showConfirmation ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Choose Identifier</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="identifierType"
                        value="email"
                        checked={identifierType === 'email'}
                        onChange={e => setIdentifierType(e.target.value)}
                        className="mr-2"
                      />
                      Use my personal email (already setup)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="identifierType"
                        value="phone"
                        checked={identifierType === 'phone'}
                        onChange={e => setIdentifierType(e.target.value)}
                        className="mr-2"
                      />
                      Use my phone number (already setup)
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
                      Enter custom identifier
                    </label>
                  </div>
                </div>

                {identifierType === 'custom' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Identifier Name</label>
                      <Input
                        placeholder="e.g., 'Work Email', 'Discord Username'"
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
                  onClick={handleJoinRequest}
                  className="w-full"
                  disabled={identifierType === 'custom' && (!customIdentifier || !customName)}
                >
                  Continue
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Confirm Your Request</h4>
                  <p className="text-sm text-yellow-800">
                    Please confirm that you have entered your identifier in the exact format required by this community.
                    This cannot be changed after submission.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 confirm-dialog-button"
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={handleJoinRequest}
                    disabled={loading}
                    className="flex-1 confirm-dialog-button"
                  >
                    {loading ? 'Submitting...' : 'Confirm & Submit'}
                  </Button>
                </div>
              </div>
            )}
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