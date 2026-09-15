'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  created_at: string;
  member_count?: number;
}

interface OrgMember {
  id: string;
  user_id: string;
  org_id: string;
  role: string;
  joined_at: string;
  profiles: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
  };
}

const ROLES = [
  { value: 'owner', label: 'Owner', color: 'text-amber-400', description: 'Full access, can manage billing and delete org' },
  { value: 'admin', label: 'Admin', color: 'text-violet-400', description: 'Can manage members, settings, and all content' },
  { value: 'member', label: 'Member', color: 'text-emerald-400', description: 'Can create and edit content' },
  { value: 'viewer', label: 'Viewer', color: 'text-zinc-400', description: 'Read-only access' },
];

export function OrganizationSettings() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'members' | 'invite'>('list');

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const orgs = await api.organizations.list();
      setOrganizations(orgs);
    } catch (error) {
      console.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (orgId: string) => {
    try {
      const data = await api.organizations.members.list(orgId);
      setMembers(data.members || data);
    } catch (error) {
      console.error('Failed to load members');
    }
  };

  const handleCreateOrg = async () => {
    if (!formName.trim()) return;
    try {
      setSaving(true);
      await api.organizations.create({ name: formName, description: formDescription });
      setFormName('');
      setFormDescription('');
      setActiveView('list');
      loadOrganizations();
    } catch (error) {
      console.error('Failed to create organization');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !selectedOrg) return;
    try {
      setSaving(true);
      await api.organizations.members.add(selectedOrg.id, { email: inviteEmail, role: inviteRole });
      setInviteEmail('');
      setInviteRole('member');
      loadMembers(selectedOrg.id);
    } catch (error) {
      console.error('Failed to invite member');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (orgId: string, userId: string, newRole: string) => {
    try {
      await api.organizations.members.update(orgId, { user_id: userId, role: newRole });
      loadMembers(orgId);
    } catch (error) {
      console.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (orgId: string, userId: string) => {
    if (!confirm('Remove this member from the organization?')) return;
    try {
      await api.organizations.members.remove(orgId, userId);
      loadMembers(orgId);
    } catch (error) {
      console.error('Failed to remove member');
    }
  };

  const openOrgMembers = async (org: Organization) => {
    setSelectedOrg(org);
    await loadMembers(org.id);
    setActiveView('members');
  };

  const getRoleInfo = (role: string) => {
    return ROLES.find((r) => r.value === role) || ROLES[2];
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Organizations</h2>
        {activeView !== 'list' && (
          <button
            onClick={() => { setActiveView('list'); setSelectedOrg(null); }}
            className="text-zinc-400 hover:text-zinc-300 text-sm"
          >
            ← Back to list
          </button>
        )}
      </div>

      {activeView === 'list' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setActiveView('create')}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              + New Organization
            </button>
          </div>

          <div className="space-y-3">
            {organizations.length === 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
                <span className="text-4xl">🏢</span>
                <p className="mt-3 text-zinc-400">No organizations yet. Create one to collaborate with your team.</p>
                <button
                  onClick={() => setActiveView('create')}
                  className="mt-4 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Create Organization
                </button>
              </div>
            ) : (
              organizations.map((org) => (
                <div
                  key={org.id}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-lg">
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold">{org.name}</h3>
                        {org.description && (
                          <p className="text-sm text-zinc-400">{org.description}</p>
                        )}
                        <p className="text-xs text-zinc-500 mt-1">
                          Created {new Date(org.created_at).toLocaleDateString('en-IN')}
                          {org.member_count !== undefined && ` • ${org.member_count} members`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openOrgMembers(org)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
                      >
                        Members
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeView === 'create' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-lg">Create Organization</h3>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="My Organization"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="What is this organization for?"
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setActiveView('list')}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOrg}
              disabled={!formName.trim() || saving}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm"
            >
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {activeView === 'members' && selectedOrg && (
        <div className="space-y-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedOrg.name}</h3>
                <p className="text-sm text-zinc-400">{members.length} members</p>
              </div>
              <button
                onClick={() => setActiveView('invite')}
                className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                + Invite Member
              </button>
            </div>

            <div className="space-y-2">
              {members.map((member) => {
                const roleInfo = getRoleInfo(member.role);
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium">
                        {getInitials(member.profiles?.full_name, member.profiles?.email)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {member.profiles?.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-zinc-400">{member.profiles?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(selectedOrg.id, member.user_id, e.target.value)}
                        className="bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-violet-500"
                      >
                        {ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemoveMember(selectedOrg.id, member.user_id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-3">Role Permissions</h3>
            <div className="space-y-2">
              {ROLES.map((role) => (
                <div key={role.value} className="flex items-start gap-3 p-2">
                  <span className={`font-medium text-sm ${role.color} w-16`}>{role.label}</span>
                  <span className="text-sm text-zinc-400">{role.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'invite' && selectedOrg && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-lg">Invite to {selectedOrg.name}</h3>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email Address</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setInviteRole(role.value)}
                  className={`p-3 rounded-lg border text-left text-sm transition-colors ${
                    inviteRole === role.value
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                  }`}
                >
                  <span className={`font-medium ${role.color}`}>{role.label}</span>
                  <p className="text-xs text-zinc-400 mt-0.5">{role.description}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setActiveView('members')}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleInviteMember}
              disabled={!inviteEmail.trim() || saving}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm"
            >
              {saving ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
