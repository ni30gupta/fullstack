import React from 'react';
import Avatar from './Avatar';

export default function EditMemberModal({ selected, form, setForm, onClose, onSave, saving }) {
  if (!selected) return null;

  const handleToggleActive = () => setForm(f => ({ ...f, is_active: !f.is_active }));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center gap-4 p-6 border-b border-gray-100">
          <Avatar name={selected.user_username} />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Edit Member</h2>
            <p className="text-sm text-gray-500">{selected.user_email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSave}>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <input
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  value={form.user_username}
                  onChange={e => setForm(f => ({ ...f, user_username: e.target.value }))}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  value={form.user_email}
                  onChange={e => setForm(f => ({ ...f, user_email: e.target.value }))}
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subscription Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 6, 12].map(months => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, duration_months: months }))}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                      form.duration_months === months
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {months} {months === 1 ? 'month' : 'months'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Membership Status</p>
                <p className="text-sm text-gray-500">Enable or disable member access</p>
              </div>
              <button
                type="button"
                onClick={handleToggleActive}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-6' : ''}`}></span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
