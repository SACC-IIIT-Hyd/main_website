import React, { useState, useEffect } from 'react';
import NavbarComponent from '@/components/navbar';
import SuperAdminPanel from '@/components/SuperAdminPanel';
import CommunityAdminPanel from '@/components/CommunityAdminPanel';
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

  useEffect(() => {
    fetchUserProfile();
    fetchUserRoles();
    fetchCommunities();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/connect/profile', {
        credentials: 'include'
      });
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      } else if (response.status === 404) {
        setShowProfileSetup(true);
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
        const profile = await response.json();
        setUserProfile(profile);
        setShowProfileSetup(false);
        alert('Profile setup completed successfully!');
      } else {
        const error = await response.json();
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
      <div className="min-h-screen bg-gray-50">
        <NavbarComponent isSticky={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (showProfileSetup && !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarComponent isSticky={true} />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Welcome to Connect!</CardTitle>
              <CardDescription className="text-center">
                Discover and join IIITH alumni communities across Discord, WhatsApp, Teams, Slack, and more. 
                To get started, please provide your personal contact information for verification purposes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSetup} className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Privacy Notice:</strong> Your personal email and phone number will be hashed and stored securely. 
                    Even we cannot retrieve your original information. This is only used to verify the authenticity of community join requests.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Personal Email Address</label>
                  <Input
                    type="email"
                    value={profileData.personal_email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, personal_email: e.target.value }))}
                    placeholder="your.personal@email.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <Input
                    type="tel"
                    value={profileData.phone_number}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone_number: e.target.value }))}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full">
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
    <div className="min-h-screen bg-gray-50">
      <NavbarComponent isSticky={true} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alumni Communities</h1>
            <p className="text-gray-600 mt-2">Connect with fellow IIITH alumni across various platforms</p>
          </div>
          
          {/* Admin Controls */}
          <div className="flex gap-2">
            {userRoles.is_community_admin && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setShowCommunityAdminPanel(true)}
              >
                <Settings className="h-4 w-4" />
                Admin Panel
              </Button>
            )}
            {userRoles.is_super_admin && (
              <Button 
                className="flex items-center gap-2"
                onClick={() => setShowSuperAdminPanel(true)}
              >
                <Plus className="h-4 w-4" />
                Super Admin
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search communities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full md:w-48"
          />
          
          <Button onClick={fetchCommunities} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </div>

        {/* Communities List */}
        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {communities.map((community) => (
              <AccordionItem key={community.id} value={community.id.toString()}>
                <AccordionTrigger className="hover:no-underline">
                  <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">
                            {community.icon || getPlatformIcon(community.platform_type)}
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="font-semibold text-lg">{community.name}</h3>
                            <p className="text-gray-600 text-sm">
                              {truncateText(community.description, 100)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">{community.platform_type}</Badge>
                              <div className="flex items-center text-sm text-gray-500">
                                <Users className="h-4 w-4 mr-1" />
                                {community.member_count} members
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {community.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {community.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{community.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AccordionTrigger>
                
                <AccordionContent>
                  <Card className="mt-2 ml-4">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900">Full Description</h4>
                          <p className="text-gray-700 mt-1">{community.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900">Platform</h4>
                            <div className="flex items-center mt-1">
                              <span className="text-lg mr-2">{getPlatformIcon(community.platform_type)}</span>
                              <span className="capitalize">{community.platform_type}</span>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900">Members</h4>
                            <div className="flex items-center mt-1">
                              <Users className="h-4 w-4 mr-2 text-gray-500" />
                              <span>{community.member_count} members</span>
                            </div>
                          </div>
                        </div>
                        
                        {community.tags.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900">Tags</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {community.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-4 border-t">
                          <JoinCommunityDrawer 
                            community={community}
                            userProfile={userProfile}
                            onJoinSuccess={() => fetchCommunities()}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          {communities.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No communities found</div>
              <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
            </div>
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
    </div>
  );
};

// Join Community Drawer Component
const JoinCommunityDrawer = ({ community, userProfile, onJoinSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [identifierType, setIdentifierType] = useState('email');
  const [customIdentifier, setCustomIdentifier] = useState('');
  const [customName, setCustomName] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleJoinRequest = async () => {
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

      const response = await fetch('/api/connect/join-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        alert('Join request submitted successfully!');
        setIsOpen(false);
        setShowConfirmation(false);
        onJoinSuccess();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
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

  return (
    <Drawer open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DrawerTrigger asChild>
        <Button 
          className="w-full" 
          disabled={community.join_request_exists}
        >
          {community.join_request_exists ? 'Request Pending' : 'Join Community'}
        </Button>
      </DrawerTrigger>
      
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Join {community.name}</DrawerTitle>
            <DrawerDescription>
              Choose how you'd like to identify yourself for this community
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 pb-6 space-y-4">
            {/* Instructions */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
              <p className="text-sm text-blue-800">{community.identifier_format_instruction}</p>
            </div>
            
            {!showConfirmation ? (
              <>
                {/* Identifier Type Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Choose Identifier</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="identifierType"
                        value="email"
                        checked={identifierType === 'email'}
                        onChange={(e) => setIdentifierType(e.target.value)}
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
                        onChange={(e) => setIdentifierType(e.target.value)}
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
                        onChange={(e) => setIdentifierType(e.target.value)}
                        className="mr-2"
                      />
                      Enter custom identifier
                    </label>
                  </div>
                </div>
                
                {/* Custom Identifier Fields */}
                {identifierType === 'custom' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Identifier Name</label>
                      <Input
                        placeholder="e.g., 'Work Email', 'Discord Username'"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Identifier Value</label>
                      <Input
                        placeholder="Enter the identifier value"
                        value={customIdentifier}
                        onChange={(e) => setCustomIdentifier(e.target.value)}
                        required
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
                    className="flex-1"
                  >
                    Go Back
                  </Button>
                  <Button 
                    onClick={handleJoinRequest}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Submitting...' : 'Confirm & Submit'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ConnectPage;