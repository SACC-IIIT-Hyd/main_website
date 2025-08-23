import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ConfirmDialog from "./ConfirmDialog";
import {
  X,
  Plus,
  Trash2,
  Edit,
  Users,
  Building2,
  MessageSquare,
  Phone,
  Briefcase,
  Send,
  Linkedin,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import "@/styles/SuperAdminPanel.scss";

// Simple Textarea component
const Textarea = ({ className, ...props }) => (
  <textarea
    className={`border border-gray-300 rounded-md p-2 w-full ${className || ""
      }`}
    {...props}
  />
);

// SuperAdminPanel Component
const SuperAdminPanel = ({ onClose }) => {
  const [communities, setCommunities] = useState([]);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [selectedCommunityForAdmins, setSelectedCommunityForAdmins] =
    useState(null);
  const [selectedCommunityForEdit, setSelectedCommunityForEdit] =
    useState(null);
  const [selectedCommunityForDelete, setSelectedCommunityForDelete] =
    useState(null);
  const [loading, setLoading] = useState(true);
  const [showRemoveAdminDialog, setShowRemoveAdminDialog] = useState(false);
  const [pendingRemoveAdminId, setPendingRemoveAdminId] = useState(null);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const response = await fetch("/api/connect/communities", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCommunities(data);
      } else {
        toast.error("Failed to fetch communities");
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    } finally {
      setLoading(false);
    }
  };

  const platformOptions = [
    { value: "discord", label: "Discord", icon: <MessageSquare size={20} /> },
    { value: "whatsapp", label: "WhatsApp", icon: <Phone size={20} /> },
    { value: "facebook", label: "Facebook", icon: <Phone size={20} /> },
    { value: "teams", label: "Microsoft Teams", icon: <Briefcase size={20} /> },
    { value: "slack", label: "Slack", icon: <Briefcase size={20} /> },
    { value: "telegram", label: "Telegram", icon: <Send size={20} /> },
    { value: "linkedin", label: "LinkedIn", icon: <Linkedin size={20} /> },
    { value: "other", label: "Other", icon: <Globe size={20} /> },
  ];

  const handleRemoveAdmin = async (adminId) => {
    setPendingRemoveAdminId(adminId);
    setShowRemoveAdminDialog(true);
  };

  const confirmRemoveAdmin = async () => {
    if (!pendingRemoveAdminId) return;

    try {
      const response = await fetch(
        `/api/connect/admins/${pendingRemoveAdminId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        toast.success("Admin removed successfully!");
        fetchCommunities(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.detail || "Failed to remove admin"}`);
      }
    } catch (error) {
      console.error("Error removing admin:", error);
      toast.error("Failed to remove admin. Please try again.");
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
              <p className="panel-subtitle">
                Manage communities and administrators
              </p>
            </div>
            <Button className="close-button" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          <div className="panel-content">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <span className="loading-text">Loading communities...</span>
              </div>
            ) : (
              <>
                {/* Action Buttons */}
                <div className="action-buttons">
                  <Button
                    className="action-btn create-community-btn"
                    onClick={() => setShowCreateCommunity(true)}
                  >
                    <Plus size={20} />
                    Create Community
                  </Button>
                  <Button
                    className="action-btn create-admin-btn"
                    onClick={() => setShowCreateAdmin(true)}
                  >
                    <Users size={20} />
                    Create Admin
                  </Button>
                </div>

                {/* Communities Grid */}
                <div className="communities-grid">
                  {communities.map((community) => (
                    <div key={community.id} className="community-card">
                      <div className="card-header">
                        <div className="community-info">
                          <span className="community-icon">
                            <Globe size={24} />
                          </span>
                          <h3 className="community-name">{community.name}</h3>
                        </div>
                        <div className="card-actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setSelectedCommunityForAdmins(community)
                            }
                            title="Manage Admins"
                          >
                            <Users size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setSelectedCommunityForEdit(community)
                            }
                            title="Edit Community"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setSelectedCommunityForDelete(community)
                            }
                            title="Delete Community"
                            className="delete-btn"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>

                      <div className="card-content">
                        <p className="community-description">
                          {community.description.length > 80
                            ? community.description.substring(0, 80) + "..."
                            : community.description}
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
                            {community.tags.slice(0, 3).map((tag, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="tag"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {community.tags.length > 3 && (
                              <Badge
                                variant="outline"
                                className="tag more-tags"
                              >
                                +{community.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {communities.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <Building2 size={48} />
                    </div>
                    <h3 className="empty-title">No Communities Found</h3>
                    <p className="empty-subtitle">
                      Create your first community to get started with alumni
                      engagement.
                    </p>
                    <Button
                      className="empty-action-btn"
                      onClick={() => setShowCreateCommunity(true)}
                    >
                      <Plus size={20} />
                      Create Community
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals and Drawers */}
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
        onSuccess={() => {
          setShowCreateAdmin(false);
          fetchCommunities();
        }}
        communities={communities}
      />

      <CommunityAdminManagement
        isOpen={!!selectedCommunityForAdmins}
        community={selectedCommunityForAdmins}
        onClose={() => setSelectedCommunityForAdmins(null)}
        onRemoveAdmin={handleRemoveAdmin}
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

      <ConfirmDialog
        open={showRemoveAdminDialog}
        title="Remove Admin"
        description="Are you sure you want to remove this admin? This action cannot be undone."
        onConfirm={confirmRemoveAdmin}
        onCancel={() => setShowRemoveAdminDialog(false)}
        confirmText="Remove"
        cancelText="Cancel"
        loading={false}
      />
    </>
  );
};

// Create Community Drawer Component
const CreateCommunityDrawer = ({
  isOpen,
  onClose,
  onSuccess,
  platformOptions,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    platform_type: "",
    tags: [],
    member_count: 0,
    invite_link: "",
    identifier_format_instruction: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/connect/communities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Community created successfully!");
        onSuccess();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.detail || "Failed to create community"}`);
      }
    } catch (error) {
      console.error("Error creating community:", error);
      toast.error("Failed to create community. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      platform_type: "",
      tags: [],
      member_count: 0,
      invite_link: "",
      identifier_format_instruction: "",
    });
    setTagInput("");
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="admin-panel-overlay">
      <div className="super-admin-panel">
        <div className="panel-container create-community-container">
          <div className="panel-header">
            <div>
              <h1 className="panel-title">Create New Community</h1>
              <p className="panel-subtitle">
                Set up a new community platform for your alumni
              </p>
            </div>
            <Button className="close-button" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          <div className="panel-content">
            <form onSubmit={handleSubmit} className="create-community-form">
              <div className="form-section">
                <div className="section-title">
                  <Building2 className="icon" />
                  Basic Information
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Community Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter community name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Platform Type *</label>
                    <select
                      value={formData.platform_type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          platform_type: e.target.value,
                        }))
                      }
                      className="platform-select"
                      required
                    >
                      <option value="">Select Platform</option>
                      {platformOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Description *</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe the community purpose and guidelines"
                      required
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-title">
                  <Users className="icon" />
                  Community Details
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Member Count</label>
                    <Input
                      type="number"
                      value={formData.member_count}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          member_count: parseInt(e.target.value) || 0,
                        }))
                      }
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Invite Link</label>
                    <Input
                      value={formData.invite_link}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          invite_link: e.target.value,
                        }))
                      }
                      placeholder="https://discord.gg/example"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-title">
                  <MessageSquare className="icon" />
                  Join Information
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Join Instructions *</label>
                    <Textarea
                      value={formData.identifier_format_instruction}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          identifier_format_instruction: e.target.value,
                        }))
                      }
                      placeholder="Instructions for how users should format their identifiers when joining"
                      required
                      rows={3}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Tags</label>
                    <div className="tags-input-container">
                      <div className="tags-input-wrapper">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Add a tag"
                          onKeyPress={(e) =>
                            e.key === "Enter" && (e.preventDefault(), addTag())
                          }
                        />
                        <Button
                          type="button"
                          onClick={addTag}
                          disabled={!tagInput.trim()}
                          className="action-btn create-community-btn"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="tags-list">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="tag">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="tag-remove"
                            >
                              <X size={12} />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <Button type="button" onClick={onClose} className="btn-cancel">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="action-btn create-community-btn submit-button"
                >
                  {loading ? "Creating..." : "Create Community"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create Admin Drawer Component
const CreateAdminDrawer = ({ isOpen, onClose, onSuccess, communities }) => {
  const [formData, setFormData] = useState({
    community_id: "",
    admin_email: "",
    admin_name: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `/api/connect/communities/${formData.community_id}/admins`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            community_id: parseInt(formData.community_id),
            admin_email: formData.admin_email,
            admin_name: formData.admin_name,
          }),
        }
      );

      if (response.ok) {
        toast.success("Admin created successfully!");
        onSuccess();
        resetForm();
      } else {
        const error = await response.json();
        console.error("Server error:", error);
        toast.error(`Error: ${error.detail || "Failed to create admin"}`);
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      toast.error(
        `Failed to create admin: ${error.message || "Please try again."}`
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      community_id: "",
      admin_email: "",
      admin_name: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="admin-panel-overlay">
      <div className="super-admin-panel">
        <div className="panel-container create-admin-container">
          <div className="panel-header">
            <div>
              <h1 className="panel-title">Create Community Admin</h1>
              <p className="panel-subtitle">
                Assign an administrator to manage a community
              </p>
            </div>
            <Button className="close-button" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          <div className="panel-content">
            <form onSubmit={handleSubmit} className="create-community-form">
              <div className="form-section">
                <div className="section-title">
                  <Users className="icon" />
                  Admin Information
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Community *</label>
                    <select
                      value={formData.community_id}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          community_id: e.target.value,
                        }))
                      }
                      className="community-select"
                      required
                    >
                      <option value="">Select Community</option>
                      {communities.map((community) => (
                        <option key={community.id} value={community.id}>
                          {community.name} ({community.platform_type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Admin Email *</label>
                    <Input
                      type="email"
                      value={formData.admin_email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          admin_email: e.target.value,
                        }))
                      }
                      placeholder="admin@iiit.ac.in"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Admin Name *</label>
                    <Input
                      value={formData.admin_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          admin_name: e.target.value,
                        }))
                      }
                      placeholder="Full Name"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <Button type="button" onClick={onClose} className="btn-cancel">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="action-btn create-admin-btn submit-button"
                >
                  {loading ? "Creating..." : "Create Admin"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Community Admin Management Component
const CommunityAdminManagement = ({
  isOpen,
  community,
  onClose,
  onRemoveAdmin,
}) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && community) {
      fetchAdmins();
    }
  }, [isOpen, community]);

  const fetchAdmins = async () => {
    if (!community) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/connect/communities/${community.id}/admins`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      } else {
        toast.error("Failed to fetch admins");
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !community) return null;

  return (
    <div className="admin-panel-overlay">
      <div className="super-admin-panel">
        <div className="panel-container create-admin-container">
          <div className="panel-header">
            <div>
              <h1 className="panel-title">Manage Admins</h1>
              <p className="panel-subtitle">{community.name} Community</p>
            </div>
            <Button className="close-button" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          <div className="panel-content">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <span className="loading-text">Loading admins...</span>
              </div>
            ) : (
              <>
                {admins.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <Users size={48} />
                    </div>
                    <h3 className="empty-title">No Admins Assigned</h3>
                    <p className="empty-subtitle">
                      This community doesn't have any admins yet.
                    </p>
                  </div>
                ) : (
                  <div className="form-section">
                    <div className="section-title">
                      <Users className="icon" />
                      Community Administrators
                    </div>
                    <div className="admins-list">
                      {admins.map((admin) => (
                        <div key={admin.id} className="admin-item">
                          <div className="admin-info">
                            <h4 className="admin-name">{admin.admin_name}</h4>
                            <p className="admin-email">{admin.admin_email}</p>
                            {admin.assigned_by && (
                              <p className="assigned-by">
                                Assigned by: {admin.assigned_by}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRemoveAdmin(admin.id)}
                            className="remove-admin-btn"
                          >
                            <Trash2 size={16} />
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Community Drawer Component
const EditCommunityDrawer = ({
  isOpen,
  community,
  onClose,
  onSuccess,
  platformOptions,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    platform_type: "",
    tags: [],
    member_count: 0,
    invite_link: "",
    identifier_format_instruction: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (community) {
      setFormData({
        name: community.name || "",
        description: community.description || "",
        platform_type: community.platform_type || "",
        tags: community.tags || [],
        member_count: community.member_count || 0,
        invite_link: community.invite_link || "",
        identifier_format_instruction:
          community.identifier_format_instruction || "",
      });
    }
  }, [community]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/connect/communities/${community.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Community updated successfully!");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.detail || "Failed to update community"}`);
      }
    } catch (error) {
      console.error("Error updating community:", error);
      toast.error("Failed to update community. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  if (!isOpen || !community) return null;

  return (
    <div className="admin-panel-overlay">
      <div className="super-admin-panel">
        <div className="panel-container create-community-container">
          <div className="panel-header">
            <div>
              <h1 className="panel-title">Edit Community</h1>
              <p className="panel-subtitle">
                Update community details for {community.name}
              </p>
            </div>
            <Button className="close-button" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          <div className="panel-content">
            <form onSubmit={handleSubmit} className="create-community-form">
              <div className="form-section">
                <div className="section-title">
                  <Building2 className="icon" />
                  Basic Information
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Community Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter community name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Platform Type *</label>
                    <select
                      value={formData.platform_type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          platform_type: e.target.value,
                        }))
                      }
                      className="platform-select"
                      required
                    >
                      <option value="">Select Platform</option>
                      {platformOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Description *</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe the community purpose and guidelines"
                      required
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-title">
                  <Users className="icon" />
                  Community Details
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Member Count</label>
                    <Input
                      type="number"
                      value={formData.member_count}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          member_count: parseInt(e.target.value) || 0,
                        }))
                      }
                      placeholder="0"
                      min="0"
                    />
                  </div>


                  <div className="form-group full-width">
                    <label className="form-label">Invite Link</label>
                    <Input
                      value={formData.invite_link}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          invite_link: e.target.value,
                        }))
                      }
                      placeholder="https://discord.gg/example"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-title">
                  <MessageSquare className="icon" />
                  Join Information
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Join Instructions *</label>
                    <Textarea
                      value={formData.identifier_format_instruction}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          identifier_format_instruction: e.target.value,
                        }))
                      }
                      placeholder="Instructions for how users should format their identifiers when joining"
                      required
                      rows={3}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Tags</label>
                    <div className="tags-input-container">
                      <div className="tags-input-wrapper">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Add a tag"
                          onKeyPress={(e) =>
                            e.key === "Enter" && (e.preventDefault(), addTag())
                          }
                        />
                        <Button
                          type="button"
                          onClick={addTag}
                          disabled={!tagInput.trim()}
                          className="action-btn create-community-btn"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="tags-list">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="tag">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="tag-remove"
                            >
                              <X size={12} />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <Button type="button" onClick={onClose} className="btn-cancel">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="action-btn create-community-btn submit-button"
                >
                  {loading ? "Updating..." : "Update Community"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Community Modal Component
const DeleteCommunityModal = ({ isOpen, community, onClose, onSuccess }) => {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!community) return;

    setLoading(true);
    try {
      // Note: The backend doesn't seem to have a delete endpoint yet
      // This would need to be implemented in the backend
      const response = await fetch(`/api/connect/communities/${community.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Community deleted successfully!");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.detail || "Failed to delete community"}`);
      }
    } catch (error) {
      console.error("Error deleting community:", error);
      toast.error("Failed to delete community. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !community) return null;

  const isConfirmValid = confirmText === community.name;

  return (
    <div className="admin-panel-overlay">
      <div className="super-admin-panel">
        <div className="panel-container delete-community-container">
          <div className="panel-header">
            <div>
              <h1 className="panel-title">Delete Community</h1>
              <p className="panel-subtitle">This action cannot be undone</p>
            </div>
            <Button className="close-button" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          <div className="panel-content">
            <div className="form-section danger-section">
              <div className="warning-section">
                <div className="warning-icon">⚠️</div>
                <h3>Permanent Action</h3>
                <p>
                  This will permanently delete the community "{community.name}"
                  and all associated data including administrators, connection
                  requests, and member information.
                </p>
              </div>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">
                    Type the community name to confirm:
                  </label>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={community.name}
                    className="confirm-input"
                  />
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <Button type="button" onClick={onClose} className="btn-cancel">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!isConfirmValid || loading}
                className="action-btn delete-btn submit-button"
              >
                {loading ? "Deleting..." : "Delete Community"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPanel;
