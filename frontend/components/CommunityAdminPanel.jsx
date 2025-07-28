import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Settings, Users, Search, CheckCircle, XCircle } from 'lucide-react';

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

  if (selectedCommunity) {
    return (
      <CommunityManagement 
        community={selectedCommunity}
        onBack={() => setSelectedCommunity(null)}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Community Admin Panel</h1>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading your communities...</div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              Select a community to manage its details and verify join requests.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminCommunities.map((community) => (
                <Card 
                  key={community.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleCommunitySelect(community)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {community.icon || '🌐'}
                      </span>
                      <CardTitle className="text-lg">{community.name}</CardTitle>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      {community.description.length > 80 
                        ? community.description.substring(0, 80) + '...'
                        : community.description
                      }
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="secondary">
                        {community.platform_type}
                      </Badge>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {community.member_count}
                      </span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <Button variant="outline" size="sm" className="w-full">
                        Manage Community
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {adminCommunities.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">No communities assigned</div>
                <p className="text-gray-400 mt-2">
                  Contact a super admin to get community admin access.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Community Management Component
const CommunityManagement = ({ community, onBack, onClose }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [communityData, setCommunityData] = useState(community);
  const [editMode, setEditMode] = useState(false);
  const [updateData, setUpdateData] = useState({
    name: community.name,
    description: community.description,
    member_count: community.member_count,
    invite_link: community.invite_link || '',
    identifier_format_instruction: community.identifier_format_instruction,
    tags: community.tags.join(', '),
    icon: community.icon || ''
  });

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/connect/communities/${community.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...updateData,
          tags: updateData.tags ? updateData.tags.split(',').map(tag => tag.trim()) : [],
          member_count: parseInt(updateData.member_count) || 0
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setCommunityData(updated);
        setEditMode(false);
        alert('Community updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating community:', error);
      alert('Failed to update community. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              ← Back
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xl">{communityData.icon || '🌐'}</span>
              <h1 className="text-2xl font-bold">{communityData.name}</h1>
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 border-b-2 font-medium ${
              activeTab === 'details' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Community Details
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-4 py-2 border-b-2 font-medium ${
              activeTab === 'verify' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Verify Requests
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' ? (
          <CommunityDetails 
            community={communityData}
            editMode={editMode}
            setEditMode={setEditMode}
            updateData={updateData}
            setUpdateData={setUpdateData}
            onUpdate={handleUpdate}
          />
        ) : (
          <VerifyRequests community={communityData} />
        )}
      </div>
    </div>
  );
};

// Community Details Tab
const CommunityDetails = ({ 
  community, 
  editMode, 
  setEditMode, 
  updateData, 
  setUpdateData, 
  onUpdate 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Community Information</h2>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button onClick={onUpdate}>
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setEditMode(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Community Name</label>
              {editMode ? (
                <Input
                  value={updateData.name}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, name: e.target.value }))}
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded">{community.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Platform</label>
              <p className="p-2 bg-gray-50 rounded capitalize">{community.platform_type}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Member Count</label>
              {editMode ? (
                <Input
                  type="number"
                  value={updateData.member_count}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, member_count: e.target.value }))}
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded">{community.member_count}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Custom Icon</label>
              {editMode ? (
                <Input
                  value={updateData.icon}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="Enter emoji or leave blank"
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded">{community.icon || 'Default'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              {editMode ? (
                <Input
                  value={updateData.tags}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="alumni, tech, social (comma-separated)"
                />
              ) : (
                <div className="flex flex-wrap gap-1">
                  {community.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">{tag}</Badge>
                  ))}
                  {community.tags.length === 0 && (
                    <p className="text-gray-500 text-sm">No tags</p>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Invite Link</label>
              {editMode ? (
                <Input
                  value={updateData.invite_link}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, invite_link: e.target.value }))}
                  placeholder="https://discord.gg/..."
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded break-all">
                  {community.invite_link || 'Not set'}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Badge variant={community.is_active ? "default" : "secondary"}>
                {community.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <textarea
              value={updateData.description}
              onChange={(e) => setUpdateData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          ) : (
            <p className="p-3 bg-gray-50 rounded">{community.description}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Join Instructions</CardTitle>
          <CardDescription>
            Instructions shown to users when they want to join this community
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <textarea
              value={updateData.identifier_format_instruction}
              onChange={(e) => setUpdateData(prev => ({ ...prev, identifier_format_instruction: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          ) : (
            <p className="p-3 bg-gray-50 rounded">{community.identifier_format_instruction}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Verify Requests Tab
const VerifyRequests = ({ community }) => {
  const [searchIdentifier, setSearchIdentifier] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerifyIdentifier = async () => {
    if (!searchIdentifier.trim()) {
      alert('Please enter an identifier to search');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/connect/communities/${community.id}/verify-identifier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ identifier: searchIdentifier })
      });

      if (response.ok) {
        const result = await response.json();
        setSearchResult(result);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error verifying identifier:', error);
      alert('Failed to verify identifier. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Verify Join Requests</CardTitle>
          <CardDescription>
            Enter an identifier to check if any alumnus has applied to join this community with that identifier.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={searchIdentifier}
              onChange={(e) => setSearchIdentifier(e.target.value)}
              placeholder="Enter identifier to verify..."
              className="flex-1"
            />
            <Button 
              onClick={handleVerifyIdentifier}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {loading ? 'Searching...' : 'Verify'}
            </Button>
          </div>

          {searchResult && (
            <div className="mt-4 p-4 border rounded-lg">
              {searchResult.found ? (
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-700">Request Found!</h4>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      <p><strong>Alumni Email:</strong> {searchResult.user_email}</p>
                      <p><strong>Alumni Name:</strong> {searchResult.user_name}</p>
                      <p><strong>Request Date:</strong> {new Date(searchResult.request_date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      This person has submitted a join request with the identifier you searched for.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-700">No Request Found</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      No join request found with the identifier "{searchIdentifier}" for this community.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Verification Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              When alumni submit join requests, their identifiers are securely hashed and stored. 
              You can verify if someone has requested to join by entering their identifier here.
            </p>
            <p>
              <strong>What you can verify:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Personal email addresses</li>
              <li>Phone numbers</li>
              <li>Custom identifiers (Discord usernames, etc.)</li>
            </ul>
            <p className="text-xs text-gray-500">
              Note: The system uses secure hashing, so we cannot see the original identifiers. 
              You need to enter the exact identifier to find matches.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityAdminPanel;