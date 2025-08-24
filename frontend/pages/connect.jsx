import React, { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import NavbarComponent from "@/components/navbar";
import SuperAdminPanel from "@/components/SuperAdminPanel";
import CommunityAdminPanel from "@/components/CommunityAdminPanel";
import ProfilePanel from "@/components/ProfilePanel";
import JoinCommunityPanel from "@/components/JoinCommunityPanel";
import Bottom from "@/components/footer";
import { withAuth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import "@/styles/connect.scss";

const ConnectPage = () => {
  const [communities, setCommunities] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [userRoles, setUserRoles] = useState({
    is_super_admin: false,
    is_community_admin: false,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileData, setProfileData] = useState({
    identifiers: [
      { label: "personal_email", value: "" },
      { label: "phone_number", value: "" },
    ],
  });
  const [showSuperAdminPanel, setShowSuperAdminPanel] = useState(false);
  const [showCommunityAdminPanel, setShowCommunityAdminPanel] = useState(false);
  const [showJoinCommunityPanel, setShowJoinCommunityPanel] = useState(null);
  const [showProfilePanel, setShowProfilePanel] = useState(false);

  // Delete identifier handler
  const handleDeleteIdentifier = async (identifierId) => {
    try {
      const response = await fetch(
        `/api/connect/profile/identifiers/${identifierId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (response.ok) {
        toast.success("Identifier deleted successfully");
        fetchUserProfile();
      } else {
        const error = await response.json();
        toast.error(
          `Failed to delete identifier: ${error.detail || "Unknown error"}`
        );
      }
    } catch (e) {
      console.error("Error deleting identifier:", e);
      toast.error("Error deleting identifier");
    }
  };

  // Add identifier handler
  const handleAddIdentifier = async (identifierData) => {
    try {
      const response = await fetch("/api/connect/profile/identifiers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(identifierData),
      });

      if (response.ok) {
        toast.success("Identifier added successfully");
        fetchUserProfile();
      } else {
        const error = await response.json();
        toast.error(
          `Failed to add identifier: ${error.detail || "Unknown error"}`
        );
      }
    } catch (e) {
      console.error("Error adding identifier:", e);
      toast.error("Error adding identifier");
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchUserRoles();
    fetchCommunities();
  }, []);

  // Auto-update communities when search or filters change
  useEffect(() => {
    fetchCommunities();
  }, [searchTerm, platformFilter, tagFilter]);

  const fetchUserProfile = async () => {
    try {
      console.log("Debug: Fetching user profile...");
      const response = await fetch("/api/connect/profile", {
        credentials: "include",
      });
      console.log("Debug: Fetching user profile response", response);

      if (response.ok) {
        const data = await response.json();
        console.log("Debug: Profile data:", data);
        setUserProfile(data);
        setShowProfileSetup(false);
      } else if (response.status === 404) {
        console.log("Debug: Profile not found, showing setup");
        setUserProfile(null);
        setShowProfileSetup(true);
      } else {
        console.error("Debug: Error fetching profile:", response.status);
        toast.error("Failed to fetch user profile");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to fetch user profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const response = await fetch("/api/connect/user-roles", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUserRoles(data);
      }
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }
  };

  const fetchCommunities = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (platformFilter) params.append("platform", platformFilter);
      if (tagFilter) params.append("tag", tagFilter);

      const response = await fetch(`/api/connect/communities?${params}`, {
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
      toast.error("Failed to fetch communities");
    }
  };

  const handleProfileSetup = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/connect/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        setShowProfileSetup(false);
        toast.success("Profile setup completed successfully!");
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.detail || "Failed to setup profile"}`);
      }
    } catch (error) {
      console.error("Error setting up profile:", error);
      toast.error("Failed to setup profile");
    }
  };

  // Helper function to get platform icons
  const getPlatformIcon = (platform) => {
    return "�"; // Use a generic globe icon for all platforms
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
                  <CardTitle className="card-title">
                    Welcome to Connect!
                  </CardTitle>
                  <CardDescription className="card-description">
                    To get started, please provide your personal contact
                    information for verification purposes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleProfileSetup}
                    className="setup-form space-y-6"
                  >
                    <div className="privacy-notice">
                      <p className="">
                        <strong>Privacy Notice:</strong> Your personal email and
                        phone number will be hashed and stored securely.
                        <br />
                        Even we cannot retrieve your original information.{" "}
                        <br />
                        This is only used to verify the authenticity of
                        community join requests.
                      </p>
                    </div>

                    <div className="form-group">
                      <label className="form-label block mb-1 font-medium">
                        Personal Email Address
                      </label>
                      <Input
                        type="email"
                        value={profileData.identifiers[0]?.value || ""}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            identifiers: prev.identifiers.map((id, index) =>
                              index === 0
                                ? { ...id, value: e.target.value }
                                : id
                            ),
                          }))
                        }
                        placeholder="your.personal@email.com"
                        required
                        className="form-input w-full"
                      />
                    </div>

                    <div className="form-group mb-6">
                      <label className="form-label block mb-1 font-medium">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        value={profileData.identifiers[1]?.value || ""}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            identifiers: prev.identifiers.map((id, index) =>
                              index === 1
                                ? { ...id, value: e.target.value }
                                : id
                            ),
                          }))
                        }
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
              <p className="subtitle">
                Connect with fellow IIITH alumni across various platforms
              </p>
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
            {(userRoles.is_community_admin || userRoles.is_super_admin) && (
              <Button
                className="admin-btn"
                onClick={() => setShowCommunityAdminPanel(true)}
                title="Community Admin Panel"
              >
                <Settings className="icon" />
                <span className="btn-text">
                  {userRoles.is_super_admin
                    ? "Manage All Communities"
                    : "Community Admin"}
                </span>
              </Button>
            )}
            {userRoles.is_super_admin && (
              <Button
                className="admin-btn"
                onClick={() => setShowSuperAdminPanel(true)}
                title="Super Admin Panel"
              >
                <Plus className="icon" />
                <span className="btn-text">Global Admin Settings</span>
              </Button>
            )}
          </div>
          {/* Profile Panel Overlay */}
          {showProfilePanel && (
            <ProfilePanel
              userProfile={userProfile}
              onDeleteIdentifier={handleDeleteIdentifier}
              onAddIdentifier={handleAddIdentifier}
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
          </div>

          {/* Communities List */}
          <div className="communities-list">
            <div className="communities-grid">
              {communities.map((community) => (
                <Card key={community.id} className="community-card-enhanced">
                  <CardContent className="community-card-content-enhanced">
                    {/* Header Section */}
                    <div className="community-header">
                      <div className="community-info">
                        <div className="platform-icon-large">
                          {getPlatformIcon(community.platform_type)}
                        </div>
                        <div className="community-basic-details">
                          <h3 className="community-name-enhanced">
                            {community.name}
                          </h3>
                          <div className="community-meta-enhanced">
                            <Badge
                              variant="secondary"
                              className="platform-badge-enhanced"
                            >
                              {community.platform_type}
                            </Badge>
                            <div className="member-count-enhanced">
                              <Users className="icon" />
                              <span>{community.member_count} members</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        className="join-button-primary"
                        disabled={community.join_request_exists}
                        onClick={() => setShowJoinCommunityPanel(community)}
                      >
                        {community.join_request_exists
                          ? "Request Pending"
                          : "Join Community"}
                      </Button>
                    </div>

                    {/* Description Section */}
                    <div className="community-description-section">
                      <p className="community-description-enhanced">
                        {community.description}
                      </p>
                    </div>

                    {/* Tags Section */}
                    {community.tags.length > 0 && (
                      <div className="tags-section-enhanced">
                        <div className="tags-grid-enhanced">
                          {community.tags.map((tag, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="tag-badge-enhanced"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {communities.length === 0 && (
              <div className="no-communities">
                <div className="no-communities-text">No communities found</div>
                <p className="no-communities-subtext">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>

          {showJoinCommunityPanel && (
            <JoinCommunityPanel
              community={showJoinCommunityPanel}
              userProfile={userProfile}
              onClose={() => setShowJoinCommunityPanel(null)}
            />
          )}
        </div>
        <Bottom />
      </div>

      {showSuperAdminPanel && (
        <SuperAdminPanel onClose={() => setShowSuperAdminPanel(false)} />
      )}

      {showCommunityAdminPanel && (
        <CommunityAdminPanel
          onClose={() => setShowCommunityAdminPanel(false)}
        />
      )}
    </>
  );
};

export default withAuth(ConnectPage);
