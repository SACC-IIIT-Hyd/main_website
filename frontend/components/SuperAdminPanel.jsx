import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Users, Trash2, Edit, X, MessageSquare, Phone, Briefcase, Send, Linkedin, Globe } from 'lucide-react';
import '@/styles/SuperAdminPanel.scss';
import { Toaster, toast } from 'sonner';

// ConfirmDialog for confirmations
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

const SuperAdminPanel = ({ onClose }) => {
  const [communities, setCommunities] = useState([]);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [selectedCommunityForAdmins, setSelectedCommunityForAdmins] = useState(null);
  const [selectedCommunityForEdit, setSelectedCommunityForEdit] = useState(null);
  const [selectedCommunityForDelete, setSelectedCommunityForDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRemoveAdminDialog, setShowRemoveAdminDialog] = useState(false);
  const [pendingRemoveAdminId, setPendingRemoveAdminId] = useState(null);

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
    { value: 'discord', label: 'Discord', icon: <MessageSquare size={20} /> },
    { value: 'whatsapp', label: 'WhatsApp', icon: <Phone size={20} /> },
    { value: 'teams', label: 'Microsoft Teams', icon: <Briefcase size={20} /> },
    { value: 'slack', label: 'Slack', icon: <Briefcase size={20} /> },
    { value: 'telegram', label: 'Telegram', icon: <Send size={20} /> },
    { value: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={20} /> },
    { value: 'other', label: 'Other', icon: <Globe size={20} /> }
  ];

  const handleRemoveAdmin = async (adminId) => {
    setPendingRemoveAdminId(adminId);
    setShowRemoveAdminDialog(true);
  };

  const confirmRemoveAdmin = async () => {
    if (!pendingRemoveAdminId) return;

    try {
      const response = await fetch(`/api/connect/community-admins/${pendingRemoveAdminId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Admin removed successfully!');
        fetchCommunityAdmins(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.message || 'Failed to remove admin'}`);
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Failed to remove admin. Please try again.');
    } finally {
      setShowRemoveAdminDialog(false);
      setPendingRemoveAdminId(null);
    }
  };

  return (
    <>
      <div className="super-admin-panel">
        <div className="panel-container">
          <div className="panel-header">
            <div>
              <h1 className="panel-title">Super Admin Panel</h1>
              <p className="panel-subtitle">Manage communities and administrators</p>
            </div>
            <Button className="close-button" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          <div className="panel-content">
            {/* Action Buttons */}
            <div className="admin-actions">
              <Button
                onClick={() => setShowCreateCommunity(true)}
                className="action-button primary"
              >
                <Plus className="icon" />
                Create Community
              </Button>

              <Button
                onClick={() => setShowCreateAdmin(true)}
                className="action-button"
              >
                <Users className="icon" />
                Assign Admin
              </Button>
            </div>

            {/* Communities Management */}
            <div className="communities-section">
              <h2 className="section-title">Manage Communities</h2>

              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <span className="loading-text">Loading communities...</span>
                </div>
              ) : (
                <div className="communities-grid">
                  {communities.map((community) => (
                    <div key={community.id} className="community-card">
                      <div className="card-header-custom">
                        <div className="card-header-content">
                          <div className="community-info">
                            <span className="platform-icon">
                              {community.icon || platformOptions.find(p => p.value === community.platform_type)?.icon}
                            </span>
                            <h3 className="community-name">{community.name}</h3>
                          </div>
                          <div className="card-actions">
                            <button
                              className="action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCommunityForAdmins(community);
                              }}
                              title="Manage Admins"
                            >
                              <Users className="icon" />
                            </button>
                            <button
                              className="action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCommunityForEdit(community);
                              }}
                              title="Edit Community"
                            >
                              <Edit className="icon" />
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCommunityForDelete(community);
                              }}
                              title="Delete Community"
                            >
                              <Trash2 className="icon" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="card-content-custom">
                        <p className="community-description">
                          {community.description.length > 100
                            ? community.description.substring(0, 100) + '...'
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

                        {community.tags && community.tags.length > 0 && (
                          <div className="tags-container">
                            {community.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="tag-badge">
                                {tag}
                              </span>
                            ))}
                            {community.tags.length > 3 && (
                              <span className="tag-badge">
                                +{community.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="status-section">
                          <span className={`status-badge ${community.is_active ? "approved" : "pending"}`}>
                            {community.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {communities.length === 0 && !loading && (
                <div className="empty-state">
                  <div className="empty-icon"><Users size={48} /></div>
                  <h3 className="empty-title">No Communities Found</h3>
                  <p className="empty-subtitle">
                    Create your first community to get started with community management.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modals rendered outside the panel container */}
      <CreateCommunityDrawer
        isOpen={showCreateCommunity}
        onClose={() => setShowCreateCommunity(false)}
        onSuccess={() => {
          setShowCreateCommunity(false);
          fetchCommunities();
        }}
        platformOptions={platformOptions}
      />

      <CreateAdminDrawer
        isOpen={showCreateAdmin}
        onClose={() => setShowCreateAdmin(false)}
        onSuccess={() => setShowCreateAdmin(false)}
        communities={communities}
      />

      <CommunityAdminManagement
        isOpen={!!selectedCommunityForAdmins}
        community={selectedCommunityForAdmins}
        onClose={() => setSelectedCommunityForAdmins(null)}
      />

      <EditCommunityDrawer
        isOpen={!!selectedCommunityForEdit}
        community={selectedCommunityForEdit}
        onClose={() => setSelectedCommunityForEdit(null)}
        onSuccess={() => {
          setSelectedCommunityForEdit(null);
          fetchCommunities();
        }}
        platformOptions={platformOptions}
      />

      <DeleteCommunityModal
        isOpen={!!selectedCommunityForDelete}
        community={selectedCommunityForDelete}
        onClose={() => setSelectedCommunityForDelete(null)}
        onSuccess={() => {
          setSelectedCommunityForDelete(null);
          fetchCommunities();
        }}
      />

      {/* Confirm Dialog for removing admin */}
      <ConfirmDialog
        open={showRemoveAdminDialog}
        title="Remove Admin"
        description="Are you sure you want to remove this admin from the community?"
        onConfirm={confirmRemoveAdmin}
        onCancel={() => setShowRemoveAdminDialog(false)}
        confirmText="Yes, Remove"
        cancelText="Cancel"
        loading={false}
      />
    </>
  );
};

// Create Community Drawer Component
const CreateCommunityDrawer = ({ isOpen, onClose, onSuccess, platformOptions }) => {
  console.log('CreateCommunityDrawer render - isOpen:', isOpen);

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
        toast.success('Community created successfully!');
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
        console.error('Backend validation error:', error);
        const errorMessage = error.detail?.[0]?.msg || error.detail || error.message || 'Unknown validation error';
        toast.error(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error creating community:', error);
      toast.error('Failed to create community. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2 className="drawer-title">Create New Community</h2>
          <p className="drawer-description">Add a new alumni community to the connect page</p>
        </div>

        <div className="drawer-content">
          <form onSubmit={handleSubmit} className="form-container">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Community Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., IIITH Alumni Discord"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Platform *</label>
                <select
                  value={formData.platform_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform_type: e.target.value }))}
                  className="form-select"
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

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the community purpose and guidelines..."
                className="form-textarea"
                rows={3}
                required
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Tags</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="alumni, tech, social (comma-separated)"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Member Count</label>
                <Input
                  type="number"
                  value={formData.member_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, member_count: e.target.value }))}
                  placeholder="0"
                  min="0"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Invite Link</label>
              <Input
                value={formData.invite_link}
                onChange={(e) => setFormData(prev => ({ ...prev, invite_link: e.target.value }))}
                placeholder="https://discord.gg/..."
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Join Instructions *</label>
              <textarea
                value={formData.identifier_format_instruction}
                onChange={(e) => setFormData(prev => ({ ...prev, identifier_format_instruction: e.target.value }))}
                placeholder="Instructions for users on how to format their identifier for joining this community..."
                className="form-textarea"
                rows={3}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Custom Icon (optional)</label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="Enter emoji or leave blank for default"
                className="form-input"
              />
            </div>

            <div className="form-actions">
              <Button type="button" variant="outline" onClick={onClose} className="btn-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="btn-submit">
                {loading ? 'Creating...' : 'Create Community'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
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
        toast.success('Community admin assigned successfully!');
        setFormData({
          community_id: '',
          admin_email: '',
          admin_name: ''
        });
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error assigning admin:', error);
      toast.error('Failed to assign admin. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2 className="drawer-title">Assign Community Admin</h2>
          <p className="drawer-description">Give admin access to a user for a specific community</p>
        </div>

        <div className="drawer-content">
          <form onSubmit={handleSubmit} className="form-container">
            <div className="form-group">
              <label className="form-label">Community *</label>
              <select
                value={formData.community_id}
                onChange={(e) => setFormData(prev => ({ ...prev, community_id: e.target.value }))}
                className="form-select"
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

            <div className="form-group">
              <label className="form-label">Admin Email *</label>
              <Input
                type="email"
                value={formData.admin_email}
                onChange={(e) => setFormData(prev => ({ ...prev, admin_email: e.target.value }))}
                placeholder="admin@iiit.ac.in"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Admin Name *</label>
              <Input
                value={formData.admin_name}
                onChange={(e) => setFormData(prev => ({ ...prev, admin_name: e.target.value }))}
                placeholder="Admin Full Name"
                required
                className="form-input"
              />
            </div>

            <div className="form-actions">
              <Button type="button" variant="outline" onClick={onClose} className="btn-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="btn-submit">
                {loading ? 'Assigning...' : 'Assign Admin'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Community Admin Management Component
const CommunityAdminManagement = ({ isOpen, community, onClose }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && community) {
      fetchCommunityAdmins();
    }
  }, [isOpen, community]);

  const fetchCommunityAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/connect/communities/${community.id}/admins`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error('Error fetching community admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminId) => {
    setPendingRemoveAdminId(adminId);
    setShowRemoveAdminDialog(true);
  };

  const confirmRemoveAdmin = async () => {
    if (!pendingRemoveAdminId) return;

    try {
      const response = await fetch(`/api/connect/community-admins/${pendingRemoveAdminId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Admin removed successfully!');
        fetchCommunityAdmins(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.message || 'Failed to remove admin'}`);
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Failed to remove admin. Please try again.');
    } finally {
      setShowRemoveAdminDialog(false);
      setPendingRemoveAdminId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2 className="drawer-title">Manage Admins - {community?.name}</h2>
          <p className="drawer-description">View and manage community administrators</p>
        </div>

        <div className="drawer-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <span className="loading-text">Loading admins...</span>
            </div>
          ) : (
            <div className="admins-list">
              {admins.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <h3 className="empty-title">No Admins Found</h3>
                  <p className="empty-subtitle">
                    This community doesn't have any assigned admins yet.
                  </p>
                </div>
              ) : (
                <div className="admins-grid">
                  {admins.map((admin) => (
                    <div key={admin.id} className="admin-card">
                      <div className="admin-info">
                        <h4 className="admin-name">{admin.admin_name}</h4>
                        <p className="admin-email">{admin.admin_email}</p>
                        <p className="admin-meta">
                          Assigned by: {admin.assigned_by}
                        </p>
                        <p className="admin-date">
                          {new Date(admin.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="admin-actions">
                        <button
                          onClick={() => handleRemoveAdmin(admin.id)}
                          className="remove-btn"
                          title="Remove Admin"
                        >
                          <Trash2 className="icon" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="drawer-actions">
            <Button onClick={onClose} className="btn-cancel">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Community Drawer Component
const EditCommunityDrawer = ({ isOpen, community, onClose, onSuccess, platformOptions }) => {
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

  useEffect(() => {
    if (community) {
      setFormData({
        name: community.name || '',
        description: community.description || '',
        platform_type: community.platform_type || 'discord',
        tags: community.tags ? community.tags.join(', ') : '',
        member_count: community.member_count || 0,
        invite_link: community.invite_link || '',
        identifier_format_instruction: community.identifier_format_instruction || '',
        icon: community.icon || ''
      });
    }
  }, [community]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        member_count: parseInt(formData.member_count) || 0
      };

      const response = await fetch(`/api/connect/communities/${community.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        toast.success('Community updated successfully!');
        onSuccess();
      } else {
        const error = await response.json();
        console.error('Backend validation error:', error);
        const errorMessage = error.detail?.[0]?.msg || error.detail || error.message || 'Unknown validation error';
        toast.error(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error updating community:', error);
      toast.error('Failed to update community. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2 className="drawer-title">Edit Community</h2>
          <p className="drawer-description">Update community information</p>
        </div>

        <div className="drawer-content">
          <form onSubmit={handleSubmit} className="form-container">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Community Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., IIITH Alumni Discord"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Platform *</label>
                <select
                  value={formData.platform_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform_type: e.target.value }))}
                  className="form-select"
                >
                  {platformOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the community and its purpose..."
                  required
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Member Count</label>
                <Input
                  type="number"
                  value={formData.member_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, member_count: e.target.value }))}
                  placeholder="0"
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., tech, networking, alumni"
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Invite Link</label>
                <Input
                  value={formData.invite_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, invite_link: e.target.value }))}
                  placeholder="https://discord.gg/..."
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Identifier Format Instructions</label>
                <Input
                  value={formData.identifier_format_instruction}
                  onChange={(e) => setFormData(prev => ({ ...prev, identifier_format_instruction: e.target.value }))}
                  placeholder="e.g., Use your IIITH email format"
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Icon URL</label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="https://example.com/icon.png"
                  className="form-input"
                />
              </div>
            </div>

            <div className="drawer-actions">
              <Button type="button" onClick={onClose} className="btn-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="btn-submit">
                {loading ? 'Updating...' : 'Update Community'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Delete Community Modal Component
const DeleteCommunityModal = ({ isOpen, community, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!community) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/connect/communities/${community.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Community deleted successfully!');
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.message || 'Failed to delete community'}`);
      }
    } catch (error) {
      console.error('Error deleting community:', error);
      toast.error('Failed to delete community. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !community) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2 className="drawer-title">Delete Community</h2>
          <p className="drawer-description">This action cannot be undone</p>
        </div>

        <div className="drawer-content">
          <div className="delete-confirmation">
            <p className="delete-warning">
              Are you sure you want to delete the community <strong>"{community.name}"</strong>?
            </p>
            <p className="delete-details">
              This will permanently remove:
            </p>
            <ul className="delete-list">
              <li>Community information and settings</li>
              <li>All assigned administrators</li>
              <li>Member data and statistics</li>
            </ul>
          </div>

          <div className="drawer-actions">
            <Button onClick={onClose} className="btn-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
              className="btn-delete"
            >
              {loading ? 'Deleting...' : 'Delete Community'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPanel;