import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Plus, Users, Settings, Trash2, Edit } from 'lucide-react';

const SuperAdminPanel = ({ onClose }) => {
  const [communities, setCommunities] = useState([]);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const response = await fetch('/api/connect/communities', {
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

  const platformOptions = [
    { value: 'discord', label: 'Discord', icon: '💬' },
    { value: 'whatsapp', label: 'WhatsApp', icon: '💚' },
    { value: 'teams', label: 'Microsoft Teams', icon: '🟦' },
    { value: 'slack', label: 'Slack', icon: '💼' },
    { value: 'telegram', label: 'Telegram', icon: '✈️' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'other', label: 'Other', icon: '🌐' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Super Admin Panel</h1>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button 
            onClick={() => setShowCreateCommunity(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Community
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setShowCreateAdmin(true)}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Assign Admin
          </Button>
        </div>

        {/* Communities Management */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Manage Communities</h2>
          
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communities.map((community) => (
                <Card key={community.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {community.icon || platformOptions.find(p => p.value === community.platform_type)?.icon}
                        </span>
                        <CardTitle className="text-lg">{community.name}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      {community.description.length > 100 
                        ? community.description.substring(0, 100) + '...'
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
                    
                    {community.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {community.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {community.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{community.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-3 pt-3 border-t">
                      <Badge 
                        variant={community.is_active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {community.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Create Community Drawer */}
        <CreateCommunityDrawer 
          isOpen={showCreateCommunity}
          onClose={() => setShowCreateCommunity(false)}
          onSuccess={() => {
            setShowCreateCommunity(false);
            fetchCommunities();
          }}
          platformOptions={platformOptions}
        />

        {/* Create Admin Drawer */}
        <CreateAdminDrawer 
          isOpen={showCreateAdmin}
          onClose={() => setShowCreateAdmin(false)}
          onSuccess={() => setShowCreateAdmin(false)}
          communities={communities}
        />
      </div>
    </div>
  );
};

// Create Community Drawer Component
const CreateCommunityDrawer = ({ isOpen, onClose, onSuccess, platformOptions }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    platform_type: 'discord',
    tags: '',
    member_count: 0,
    invite_link: '',
    identifier_format_instruction: '',
    icon: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        member_count: parseInt(formData.member_count) || 0
      };

      const response = await fetch('/api/connect/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        alert('Community created successfully!');
        setFormData({
          name: '',
          description: '',
          platform_type: 'discord',
          tags: '',
          member_count: 0,
          invite_link: '',
          identifier_format_instruction: '',
          icon: ''
        });
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating community:', error);
      alert('Failed to create community. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader>
            <DrawerTitle>Create New Community</DrawerTitle>
            <DrawerDescription>
              Add a new alumni community to the connect page
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Community Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., IIITH Alumni Discord"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Platform *</label>
                  <select
                    value={formData.platform_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, platform_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {platformOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the community purpose and guidelines..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tags</label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="alumni, tech, social (comma-separated)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Member Count</label>
                  <Input
                    type="number"
                    value={formData.member_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, member_count: e.target.value }))}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Invite Link</label>
                <Input
                  value={formData.invite_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, invite_link: e.target.value }))}
                  placeholder="https://discord.gg/..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Join Instructions *</label>
                <textarea
                  value={formData.identifier_format_instruction}
                  onChange={(e) => setFormData(prev => ({ ...prev, identifier_format_instruction: e.target.value }))}
                  placeholder="Instructions for users on how to format their identifier for joining this community..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Custom Icon (optional)</label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="Enter emoji or leave blank for default"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create Community'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

// Create Admin Drawer Component
const CreateAdminDrawer = ({ isOpen, onClose, onSuccess, communities }) => {
  const [formData, setFormData] = useState({
    community_id: '',
    admin_email: '',
    admin_name: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/connect/community-admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          community_id: parseInt(formData.community_id),
          admin_email: formData.admin_email,
          admin_name: formData.admin_name
        })
      });

      if (response.ok) {
        alert('Community admin assigned successfully!');
        setFormData({
          community_id: '',
          admin_email: '',
          admin_name: ''
        });
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error assigning admin:', error);
      alert('Failed to assign admin. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>Assign Community Admin</DrawerTitle>
            <DrawerDescription>
              Give admin access to a user for a specific community
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Community *</label>
                <select
                  value={formData.community_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, community_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a community</option>
                  {communities.map(community => (
                    <option key={community.id} value={community.id}>
                      {community.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Admin Email *</label>
                <Input
                  type="email"
                  value={formData.admin_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, admin_email: e.target.value }))}
                  placeholder="admin@iiit.ac.in"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Admin Name *</label>
                <Input
                  value={formData.admin_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, admin_name: e.target.value }))}
                  placeholder="Admin Full Name"
                  required
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Assigning...' : 'Assign Admin'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SuperAdminPanel;