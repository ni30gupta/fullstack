import React, { useEffect, useState } from 'react'
import useMemberList from '../hooks/useMemberList';
import { gymService } from '../api/gymService'
import Avatar from '../components/members/Avatar'
import StatusBadge from '../components/members/StatusBadge'
import EditMemberModal from '../components/members/EditMemberModal'

const Member = () => {
  const gymId = 2; // TODO: make dynamic
  const { members, refresh } = useMemberList(gymId);

  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (selected) {
      setForm({
        membership_id: selected.id,
        duration_months: selected.duration_months || 1,
        is_active: !!selected.is_active,
        user_email: selected.user_email || '',
        user_username: selected.user_username || '',
      });
    }
  }, [selected]);

  function openEdit(m) {
    setSelected(m);
    setEditing(true);
  }

  function closeModal() {
    setEditing(false);
    setSelected(null);
    setForm({});
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await gymService.updateMember(gymId, selected.id, {
        duration_months: form.duration_months,
        is_active: form.is_active,
      });
      await refresh();
      closeModal();
    } catch (err) {
      console.error('Failed to save member', err);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  

  // Filter members
  const filteredMembers = members?.filter(m => 
    m.user_username?.toLowerCase().includes(search.toLowerCase()) ||
    m.user_email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const activeCount = members?.filter(m => m.is_active).length || 0;
  const totalCount = members?.length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        <p className="text-gray-500 mt-1">Manage your gym members and their subscriptions</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Members</p>
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="text-2xl font-bold text-gray-500">{totalCount - activeCount}</p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button onClick={refresh} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {search ? 'No members found matching your search.' : 'No members yet.'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.user_username} />
                        <div>
                          <p className="font-medium text-gray-900">{m.user_username}</p>
                          <p className="text-sm text-gray-500">{m.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 font-medium">{m.duration_months}</span>
                      <span className="text-gray-500 text-sm"> month{m.duration_months > 1 ? 's' : ''}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge active={m.is_active} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEdit(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 text-sm text-gray-500">
          Showing {filteredMembers.length} of {totalCount} members
        </div>
      </div>

      {/* Edit Modal */}
      {editing && selected && (
        <EditMemberModal
          selected={selected}
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  )
}

export default Member