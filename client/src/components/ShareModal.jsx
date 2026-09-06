import React, { useState } from 'react';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Avatar from './ui/Avatar';

function ShareModal({
  isOpen,
  onClose,
  document,
  onShare,
  onUpdateRole,
  onRemoveCollaborator
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EDITOR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await onShare(email.trim(), role);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to share document');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!document) return null;

  const collaborators = document.collaborators || [];
  const owner = document.owner || { name: 'Owner', email: 'owner@collabspace.com' };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Document"
      subtitle={`Manage permissions and collaboration for "${document.title || 'Untitled'}"`}
      maxWidth="max-w-lg"
    >
      {/* Invite Form */}
      <form onSubmit={handleShareSubmit} className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2.5 items-end">
          <div className="flex-1 w-full">
            <Input
              label="Invite Teammate by Email"
              placeholder="e.g. sarah@collabspace.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              required
            />
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full sm:w-auto bg-dark-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="EDITOR">Can Edit</option>
              <option value="VIEWER">Can View</option>
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full sm:w-auto"
          >
            Invite
          </Button>
        </div>
      </form>

      {/* Collaborators List */}
      <div className="border-t border-white/10 pt-4 mb-6">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          People with Access
        </h4>

        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
          {/* Document Owner */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
              <Avatar name={owner.name} email={owner.email} size="md" />
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>{owner.name}</span>
                  <span className="text-xs text-gray-400">(You)</span>
                </p>
                <p className="text-xs text-gray-400">{owner.email}</p>
              </div>
            </div>
            <Badge variant="primary">Owner</Badge>
          </div>

          {/* Invited Collaborators */}
          {collaborators.map((collab) => (
            <div
              key={collab.id || collab.userId}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  name={collab.user?.name || 'Collaborator'}
                  email={collab.user?.email}
                  size="md"
                />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {collab.user?.name || collab.user?.email || 'Collaborator'}
                  </p>
                  <p className="text-xs text-gray-400">{collab.user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={collab.role}
                  onChange={(e) => onUpdateRole(collab.userId, e.target.value)}
                  className="bg-dark-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="EDITOR">Can Edit</option>
                  <option value="VIEWER">Can View</option>
                </select>

                <button
                  onClick={() => onRemoveCollaborator(collab.userId)}
                  title="Remove Access"
                  className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center text-xs transition"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Copy Link Footer */}
      <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>🔗</span>
          <span>Anyone with the link and permissions can access</span>
        </div>

        <Button
          variant={copied ? 'success' : 'secondary'}
          size="sm"
          onClick={handleCopyLink}
          icon={copied ? '✓' : '📋'}
        >
          {copied ? 'Link Copied!' : 'Copy Link'}
        </Button>
      </div>
    </Modal>
  );
}

export default ShareModal;
