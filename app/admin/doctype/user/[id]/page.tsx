"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, Phone, Calendar, Shield, Settings, Users, Clock, Globe, Lock, Key, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

interface UserDetail {
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  username?: string;
  language?: string;
  time_zone?: string;
  enabled?: boolean;
  mobile_no?: string;
  phone?: string;
  user_type?: string;
  user_image?: string;
  send_welcome_email?: boolean;
  module_profile?: string;
  desk_theme?: string;
  search_bar?: boolean;
  notifications?: boolean;
  list_sidebar?: boolean;
  bulk_actions?: boolean;
  view_switcher?: boolean;
  form_sidebar?: boolean;
  timeline?: boolean;
  dashboard?: boolean;
  mute_sounds?: boolean;
  unsubscribed?: boolean;
  logout_all_sessions?: boolean;
  reset_password_key?: string;
  last_reset_password_key_generated_on?: string;
  document_follow_notify?: boolean;
  document_follow_frequency?: string;
  follow_created_documents?: boolean;
  follow_commented_documents?: boolean;
  follow_liked_documents?: boolean;
  follow_assigned_documents?: boolean;
  follow_shared_documents?: boolean;
  thread_notify?: boolean;
  send_me_a_copy?: boolean;
  allowed_in_mentions?: boolean;
  simultaneous_sessions?: number;
  login_after?: boolean;
  login_before?: boolean;
  bypass_restrict_ip_check_if_2fa_enabled?: boolean;
  onboarding_status?: string;
  roles?: Array<{
    name: string;
    role: string;
  }>;
  block_modules?: Array<{
    name: string;
    module: string;
  }>;
  social_logins?: Array<{
    name: string;
    provider: string;
    userid: string;
  }>;
  creation?: string;
  modified?: string;
  owner?: string;
  modified_by?: string;
  docstatus?: number;
}

export default function UserDetailPage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated } = useAuth();
  const params = useParams();
  const id = params.id;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<UserDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!id || typeof id !== 'string') {
      setError('Invalid user ID');
      setLoading(false);
      return;
    }

    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://103.219.3.169:2223/api/resource/User/${id}?fields=["name","email","first_name","last_name","full_name","username","language","time_zone","enabled","mobile_no","phone","user_type","user_image","send_welcome_email","module_profile","desk_theme","search_bar","notifications","list_sidebar","bulk_actions","view_switcher","form_sidebar","timeline","dashboard","mute_sounds","unsubscribed","logout_all_sessions","reset_password_key","last_reset_password_key_generated_on","document_follow_notify","document_follow_frequency","follow_created_documents","follow_commented_documents","follow_liked_documents","follow_assigned_documents","follow_shared_documents","thread_notify","send_me_a_copy","allowed_in_mentions","simultaneous_sessions","login_after","login_before","bypass_restrict_ip_check_if_2fa_enabled","onboarding_status","creation","modified","owner","modified_by","docstatus"]`,
        {
          headers: {
            'Authorization': `token ${apiKey}:${apiSecret}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data); // Debug log
      setUser(data.data || data);
      setFormData(data.data || data);
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err.message || 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(
        `http://103.219.3.169:2223/api/resource/User/${id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${apiKey}:${apiSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.statusText}`);
      }

      const data = await response.json();
      setUser(data.data);
      setEditing(false);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserDetail, value: any) => {
    if (!formData) return;
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">User not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Debug Info */}
      {/* <div className="mb-4 p-2 bg-yellow-100 text-sm">
        <strong>Debug Info:</strong><br/>
        User ID: {id}<br/>
        User Data: {JSON.stringify(user, null, 2)}<br/>
        Active Tab: {activeTab}<br/>
        Loading: {loading.toString()}<br/>
        Error: {error || 'None'}
      </div> */}

      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
          <div className="space-x-2">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back
            </button>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData(user);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* User Image */}
        <div className="flex justify-center mb-6">
          {user.user_image ? (
            <img
              src={`http://103.219.3.169:2223${user.user_image}`}
              alt={user.full_name || user.email}
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-gray-200 flex items-center justify-center">
              <Users className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              User Details
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Roles & Permissions
            </button>
            <button
              onClick={() => setActiveTab('more')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'more'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              More Information
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Settings
            </button>
            {/* <button 
              onClick={() => setActiveTab('connections')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'connections' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Connections
            </button> */}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-2" />
                Email
              </label>
              <input
                type="email"
                value={editing ? formData?.email || '' : user.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline w-4 h-4 mr-2" />
                Full Name
              </label>
              <input
                type="text"
                value={editing ? formData?.full_name || '' : user.full_name || ''}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                value={editing ? formData?.first_name || '' : user.first_name || ''}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={editing ? formData?.last_name || '' : user.last_name || ''}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={editing ? formData?.username || '' : user.username || ''}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="inline w-4 h-4 mr-2" />
                Language
              </label>
              <select
                value={editing ? formData?.language || '' : user.language || ''}
                onChange={(e) => handleInputChange('language', e.target.value)}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Language</option>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>

            {/* Time Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-2" />
                Time Zone
              </label>
              <input
                type="text"
                value={editing ? formData?.time_zone || '' : user.time_zone || ''}
                onChange={(e) => handleInputChange('time_zone', e.target.value)}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline w-4 h-4 mr-2" />
                Mobile
              </label>
              <input
                type="tel"
                value={editing ? formData?.mobile_no || '' : user.mobile_no || ''}
                onChange={(e) => handleInputChange('mobile_no', e.target.value)}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline w-4 h-4 mr-2" />
                Phone
              </label>
              <input
                type="tel"
                value={editing ? formData?.phone || '' : user.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* User Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
              <select
                value={editing ? formData?.user_type || '' : user.user_type || ''}
                onChange={(e) => handleInputChange('user_type', e.target.value)}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select User Type</option>
                <option value="System User">System User</option>
                <option value="Website User">Website User</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="inline w-4 h-4 mr-2" />
                Status
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="enabled"
                    checked={editing ? formData?.enabled === true : user.enabled === true}
                    onChange={() => handleInputChange('enabled', true)}
                    disabled={!editing}
                    className="mr-2"
                  />
                  <span className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                    Enabled
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="enabled"
                    checked={editing ? formData?.enabled === false : user.enabled === false}
                    onChange={() => handleInputChange('enabled', false)}
                    disabled={!editing}
                    className="mr-2"
                  />
                  <span className="flex items-center">
                    <XCircle className="w-4 h-4 mr-1 text-red-500" />
                    Disabled
                  </span>
                </label>
              </div>
            </div>

            {/* Send Welcome Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Send Welcome Email</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editing ? formData?.send_welcome_email === true : user.send_welcome_email === true}
                    onChange={(e) => handleInputChange('send_welcome_email', e.target.checked)}
                    disabled={!editing}
                    className="mr-2"
                  />
                  <span>Yes</span>
                </label>
              </div>
            </div>

            {/* Roles & Permissions */}
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="inline w-4 h-4 mr-2" />
                Roles & Permissions
              </label>
              <div className="space-y-2">
                {user?.roles?.map((role, index) => (
                  <label key={index} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editing ? formData?.roles?.some((r: any) => r.role === role.role) : true}
                      onChange={(e) => {
                        const currentRoles = formData?.roles || [];
                        if (e.target.checked) {
                          handleInputChange('roles', [...currentRoles, role]);
                        } else {
                          handleInputChange('roles', currentRoles.filter((r: any) => r.role !== role.role));
                        }
                      }}
                      disabled={!editing}
                      className="mr-2"
                    />
                    <span>{role.role}</span>
                  </label>
                )) || <p className="text-gray-500">No roles available</p>}
              </div>
            </div> */}

            {/* Allowed Modules */}
            {/* <label className="block text-sm font-medium text-gray-700 mb-2">
                <Settings className="inline w-4 h-4 mr-2" />
                Allowed Modules
              </label> */}
            {/* <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Accounts', 'Asset Maintenence', 'Automation', 'Buying', 'CRM', 'Communication', 'Contacts', 'Core', 'Custom', 'Desk', 'EDI', 'ERPNext Integrations', 'Email', 'Geo', 'Integrations', 'LIS Management', 'Maintenance', 'Manufacturing', 'Operations', 'Portal', 'Printing', 'Projects', 'Quality Management', 'Regional', 'Selling', 'Setup', 'Social', 'Stock', 'Subcontracting', 'Support', 'Telephony', 'Tendor', 'Utilities', 'Website', 'Workflow'].map((module) => (
                  <label key={module} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editing ? !formData?.block_modules?.some((m: any) => m.module === module) : !user?.block_modules?.some((m: any) => m.module === module)}
                      onChange={(e) => {
                        const currentBlocked = formData?.block_modules || [];
                        if (e.target.checked) {
                          handleInputChange('block_modules', currentBlocked.filter((m: any) => m.module !== module));
                        } else {
                          handleInputChange('block_modules', [...currentBlocked, { name: '', module }]);
                        }
                      }}
                      disabled={!editing}
                      className="mr-2"
                    />
                    <span className="text-sm">{module}</span>
                  </label>
                ))}
              </div> */}

          </div>
        )}

        {activeTab === 'roles' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Roles & Permissions</h3>

            {/* Roles Section */}
            {/* <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Assigned Roles</h4>
              <div className="space-y-2">
                {user?.roles?.map((role, index) => (
                  <label key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={editing ? formData?.roles?.some((r: any) => r.role === role.role) : true}
                      onChange={(e) => {
                        const currentRoles = formData?.roles || [];
                        if (e.target.checked) {
                          handleInputChange('roles', [...currentRoles, role]);
                        } else {
                          handleInputChange('roles', currentRoles.filter((r: any) => r.role !== role.role));
                        }
                      }}
                      disabled={!editing}
                      className="mr-2"
                    />
                    <span className="font-medium">{role.role}</span>
                    <span className="text-sm text-gray-500">{role.name}</span>
                  </label>
                )) || <p className="text-gray-500">No roles assigned</p>}
              </div>
            </div> */}

            {/* Module Permissions Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">Module Permissions</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Accounts', 'Asset Maintenence', 'Automation', 'Buying', 'CRM', 'Communication', 'Contacts', 'Core', 'Custom', 'Desk', 'EDI', 'ERPNext Integrations', 'Email', 'Geo', 'Integrations', 'LIS Management', 'Maintenance', 'Manufacturing', 'Operations', 'Portal', 'Printing', 'Projects', 'Quality Management', 'Regional', 'Selling', 'Setup', 'Social', 'Stock', 'Subcontracting', 'Support', 'Telephony', 'Tendor', 'Utilities', 'Website', 'Workflow'].map((module) => (
                  <label key={module} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editing ? !formData?.block_modules?.some((m: any) => m.module === module) : !user?.block_modules?.some((m: any) => m.module === module)}
                      onChange={(e) => {
                        const currentBlocked = formData?.block_modules || [];
                        if (e.target.checked) {
                          handleInputChange('block_modules', currentBlocked.filter((m: any) => m.module !== module));
                        } else {
                          handleInputChange('block_modules', [...currentBlocked, { name: '', module }]);
                        }
                      }}
                      disabled={!editing}
                      className="mr-2"
                    />
                    <span className="text-sm">{module}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'more' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">More Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Module Profile</label>
                <input
                  type="text"
                  value={editing ? formData?.module_profile || '' : user.module_profile || ''}
                  onChange={(e) => handleInputChange('module_profile', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Desk Theme</label>
                <select
                  value={editing ? formData?.desk_theme || '' : user.desk_theme || ''}
                  onChange={(e) => handleInputChange('desk_theme', e.target.value)}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Theme</option>
                  <option value="Light">Light</option>
                  <option value="Dark">Dark</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Simultaneous Sessions</label>
                <input
                  type="number"
                  value={editing ? formData?.simultaneous_sessions || '' : user.simultaneous_sessions || ''}
                  onChange={(e) => handleInputChange('simultaneous_sessions', parseInt(e.target.value))}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Bar</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editing ? formData?.search_bar === true : user.search_bar === true}
                      onChange={(e) => handleInputChange('search_bar', e.target.checked)}
                      disabled={!editing}
                      className="mr-2"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notifications</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editing ? formData?.notifications === true : user.notifications === true}
                      onChange={(e) => handleInputChange('notifications', e.target.checked)}
                      disabled={!editing}
                      className="mr-2"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">List Sidebar</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editing ? formData?.list_sidebar === true : user.list_sidebar === true}
                      onChange={(e) => handleInputChange('list_sidebar', e.target.checked)}
                      disabled={!editing}
                      className="mr-2"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editing ? formData?.timeline === true : user.timeline === true}
                      onChange={(e) => handleInputChange('timeline', e.target.checked)}
                      disabled={!editing}
                      className="mr-2"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editing ? formData?.dashboard === true : user.dashboard === true}
                      onChange={(e) => handleInputChange('dashboard', e.target.checked)}
                      disabled={!editing}
                      className="mr-2"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mute Sounds</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editing ? formData?.mute_sounds === true : user.mute_sounds === true}
                      onChange={(e) => handleInputChange('mute_sounds', e.target.checked)}
                      disabled={!editing}
                      className="mr-2"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logout All Sessions</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editing ? formData?.logout_all_sessions === true : user.logout_all_sessions === true}
                      onChange={(e) => handleInputChange('logout_all_sessions', e.target.checked)}
                      disabled={!editing}
                      className="mr-2"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* {activeTab === 'connections' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Connections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Social Logins</h4>
                <div className="space-y-2">
                  {user?.social_logins?.map((login, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-medium">{login.provider}</span>
                      <span className="text-sm text-gray-500">{login.userid}</span>
                    </div>
                  )) || <p className="text-gray-500">No social logins</p>}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Blocked Modules</h4>
                <div className="space-y-2">
                  {user?.block_modules?.map((module, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-medium">{module.module}</span>
                      <span className="text-sm text-gray-500">{module.name}</span>
                    </div>
                  )) || <p className="text-gray-500">No blocked modules</p>}
                </div>
              </div>
            </div>
          </div>
        )} */}

        {/* Additional Information */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Created:</span>
              <span className="text-gray-600">{new Date(user.creation || '').toLocaleString()}</span>
            </div>
            <div>
              <span className="font-medium">Modified:</span>
              <span className="text-gray-600">{new Date(user.modified || '').toLocaleString()}</span>
            </div>
            <div>
              <span className="font-medium">Owner:</span>
              <span className="text-gray-600">{user.owner || ''}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}