/**
 * src/components/views/UserManagementView.jsx
 *
 * Admin-only view for managing users and roles.
 */
import React, { useState } from 'react';
import { useAuthContext, DEFAULT_PERMISSIONS } from '../../contexts/AuthContext';
import { 
  Users, PlusCircle, Trash2, ShieldCheck, User, Eye, EyeOff, 
  X, Check, AlertCircle, Settings, Edit2, Shield, Lock
} from 'lucide-react';
import styles from './UserManagementView.module.css';

// ─── Modal Components ────────────────────────────────────────────────────────

const CreateUserModal = ({ onClose, onCreated }) => {
  const { createUser, roles } = useAuthContext();
  const [form, setForm] = useState({ username: '', fullName: '', password: '', role: 'user' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = createUser(form);
    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => { onCreated(); onClose(); }, 900);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3><PlusCircle size={18} /> Create New User</h3>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        {success ? (
          <div className={styles.successMsg}>
            <Check size={24} />
            <p>User created successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Username *</label>
              <input name="username" value={form.username} onChange={handleChange} placeholder="e.g., john" required autoFocus />
            </div>
            <div className={styles.field}>
              <label>Full Name</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="e.g., John Smith" />
            </div>
            <div className={styles.field}>
              <label>Password *</label>
              <div className={styles.passWrapper}>
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Set a password" required />
                <button type="button" className={styles.togglePass} onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className={styles.field}>
              <label>Role</label>
              <select name="role" value={form.role} onChange={handleChange}>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            {error && <div className={styles.errorMsg}><AlertCircle size={15} /><span>{error}</span></div>}
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button type="submit" className={styles.submitBtn}><PlusCircle size={16} /> Create User</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const EditUserModal = ({ user, onClose, onUpdated }) => {
  const { updateUser, roles } = useAuthContext();
  const [form, setForm] = useState({ fullName: user.fullName || '', password: '', role: user.role });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    // Only send password if it was changed
    const changes = { fullName: form.fullName, role: form.role };
    if (form.password) changes.password = form.password;

    const result = updateUser(user.id, changes);
    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => { onUpdated(); onClose(); }, 900);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3><Edit2 size={18} /> Edit User: {user.username}</h3>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        {success ? (
          <div className={styles.successMsg}><Check size={24} /><p>User updated successfully!</p></div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Full Name</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="e.g., John Smith" />
            </div>
            <div className={styles.field}>
              <label>New Password (leave blank to keep current)</label>
              <div className={styles.passWrapper}>
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Enter new password" />
                <button type="button" className={styles.togglePass} onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className={styles.field}>
              <label>Role</label>
              <select name="role" value={form.role} onChange={handleChange}>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            {error && <div className={styles.errorMsg}><AlertCircle size={15} /><span>{error}</span></div>}
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button type="submit" className={styles.submitBtn}><Check size={16} /> Update User</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const RoleModal = ({ role, onClose, onSaved }) => {
  const { createRole, updateRole } = useAuthContext();
  const [name, setName] = useState(role?.name || '');
  const [perms, setPerms] = useState(role?.permissions || DEFAULT_PERMISSIONS);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleToggle = (key) => setPerms(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    let result;
    if (role) {
      result = updateRole(role.id, { name, permissions: perms });
    } else {
      result = createRole({ name, permissions: perms });
    }

    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => { onSaved(); onClose(); }, 900);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{role ? <Edit2 size={18} /> : <PlusCircle size={18} />} {role ? 'Edit Role' : 'Create New Role'}</h3>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        {success ? (
          <div className={styles.successMsg}><Check size={24} /><p>Role saved successfully!</p></div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Role Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Manager" required disabled={role?.id === 'admin'} />
            </div>
            
            <div className={styles.permissionsGrid}>
              <p className={styles.gridTitle}>Permissions</p>
              {Object.keys(DEFAULT_PERMISSIONS).map(key => (
                <label key={key} className={styles.checkboxLabel}>
                  <input type="checkbox" checked={perms[key]} onChange={() => handleToggle(key)} disabled={role?.id === 'admin'} />
                  <span>{key.replace(/([A-Z])/g, ' $1').replace(/^can /, 'Can ')}</span>
                </label>
              ))}
            </div>

            {error && <div className={styles.errorMsg}><AlertCircle size={15} /><span>{error}</span></div>}
            
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button type="submit" className={styles.submitBtn} disabled={role?.id === 'admin'}>
                <Check size={16} /> {role ? 'Save Changes' : 'Create Role'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────

const UserManagementView = () => {
  const { users, roles, currentUser, deleteUser, deleteRole } = useAuthContext();
  const [activeTab, setActiveTab] = useState('users');
  const [modalType, setModalType] = useState(null); // 'create-user', 'edit-user', 'role'
  const [selectedItem, setSelectedItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDeleteUser = (user) => {
    if (window.confirm(`Delete user "${user.username}"?`)) {
      const result = deleteUser(user.id);
      if (!result.success) alert(result.error);
    }
  };

  const handleDeleteRole = (role) => {
    if (window.confirm(`Delete role "${role.name}"?`)) {
      const result = deleteRole(role.id);
      if (!result.success) alert(result.error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h2><Shield size={22} /> System Management</h2>
          <p className={styles.subtitle}>Configure user accounts and access permissions.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.tabBtn} onClick={() => setActiveTab('users')} data-active={activeTab === 'users'}>
            <Users size={18} /> Users
          </button>
          <button className={styles.tabBtn} onClick={() => setActiveTab('roles')} data-active={activeTab === 'roles'}>
            <ShieldCheck size={18} /> Roles
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <>
          <div className={styles.tabHeader}>
            <h3>User Accounts</h3>
            <button className={styles.addBtn} onClick={() => setModalType('create-user')}>
              <PlusCircle size={18} /> Add User
            </button>
          </div>
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className={user.id === currentUser?.id ? styles.selfRow : ''}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={`${styles.avatar} ${user.role === 'admin' ? styles.adminAvatar : styles.userAvatar}`}>
                          {(user.fullName || user.username)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className={styles.fullName}>{user.fullName || user.username} <code className={styles.codeText}>@{user.username}</code></p>
                          {user.id === currentUser?.id && <span className={styles.youBadge}>You</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.rolePill} ${user.role === 'admin' ? styles.adminPill : styles.userPill}`}>
                        {roles.find(r => r.id === user.role)?.name || user.role}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        <button className={styles.iconAction} onClick={() => { setSelectedItem(user); setModalType('edit-user'); }} title="Edit User">
                          <Edit2 size={16} />
                        </button>
                        <button className={styles.deleteBtn} onClick={() => handleDeleteUser(user)} disabled={user.id === currentUser?.id}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className={styles.tabHeader}>
            <h3>Access Roles</h3>
            <button className={styles.addBtn} onClick={() => { setSelectedItem(null); setModalType('role'); }}>
              <PlusCircle size={18} /> Add Role
            </button>
          </div>
          <div className={styles.rolesGrid}>
            {roles.map(role => (
              <div key={role.id} className={styles.roleCard}>
                <div className={styles.roleCardHeader}>
                  <div className={styles.roleNameInfo}>
                    <ShieldCheck size={20} className={role.id === 'admin' ? styles.adminIcon : ''} />
                    <h4>{role.name}</h4>
                  </div>
                  <div className={styles.roleActions}>
                    <button onClick={() => { setSelectedItem(role); setModalType('role'); }} disabled={role.id === 'admin'}><Edit2 size={14} /></button>
                    <button onClick={() => handleDeleteRole(role)} disabled={role.builtIn} className={styles.deleteRoleBtn}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className={styles.permsList}>
                  {Object.entries(role.permissions).map(([key, val]) => (
                    <div key={key} className={`${styles.permItem} ${val ? styles.permActive : ''}`}>
                      {val ? <Check size={12} /> : <X size={12} />}
                      <span>{key.replace(/([A-Z])/g, ' $1').replace(/^can /, 'Can ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modalType === 'create-user' && <CreateUserModal onClose={() => setModalType(null)} onCreated={() => setRefreshKey(k => k + 1)} />}
      {modalType === 'edit-user' && <EditUserModal user={selectedItem} onClose={() => setModalType(null)} onUpdated={() => setRefreshKey(k => k + 1)} />}
      {modalType === 'role' && <RoleModal role={selectedItem} onClose={() => setModalType(null)} onSaved={() => setRefreshKey(k => k + 1)} />}
    </div>
  );
};

export default UserManagementView;
