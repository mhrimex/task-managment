/**
 * src/contexts/AuthContext.jsx
 *
 * Provides global authentication and role/permission management.
 *
 * PERMISSION SYSTEM:
 * ------------------
 * Instead of a fixed "admin/user" binary, permissions are defined per ROLE.
 * Each role has a set of boolean permissions:
 *   - canUpdateStatus  : Can change task status (complete, skip, cancel)
 *   - canEditTask      : Can edit task details (title, description, etc.)
 *   - canDeleteTask    : Can delete tasks
 *   - canCreateTask    : Can create new tasks
 *   - canAssignTask    : Can assign tasks to other users (admin feature)
 *   - canManageUsers   : Can access the user management panel
 *
 * Roles are stored in localStorage["app_roles"].
 * Users are stored in localStorage["app_users"].
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

// ─── Default permission sets ─────────────────────────────────────────────────

export const DEFAULT_PERMISSIONS = {
  canUpdateStatus : true,
  canEditTask     : false,
  canDeleteTask   : false,
  canCreateTask   : true,  // Failsafe: allow creation by default
  canAssignTask   : false,
  canManageUsers  : false,
};

const BUILT_IN_ROLES = [
  {
    id: 'admin',
    name: 'Admin',
    builtIn: true, // cannot be deleted
    permissions: {
      canUpdateStatus : true,
      canEditTask     : true,
      canDeleteTask   : true,
      canCreateTask   : true,
      canAssignTask   : true,
      canManageUsers  : true,
    },
  },
  {
    id: 'user',
    name: 'User',
    builtIn: false,
    permissions: {
      canUpdateStatus : true,
      canEditTask     : false,
      canDeleteTask   : false,
      canCreateTask   : true,  // Allow users to create tasks by default
      canAssignTask   : false,
      canManageUsers  : false,
    },
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

const loadRoles = () => {
  try {
    const stored = localStorage.getItem('app_roles');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  localStorage.setItem('app_roles', JSON.stringify(BUILT_IN_ROLES));
  return BUILT_IN_ROLES;
};

const saveRoles = (roles) => localStorage.setItem('app_roles', JSON.stringify(roles));

const loadUsers = () => {
  try {
    const stored = localStorage.getItem('app_users');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}

  const defaults = [
    { id: '1', username: 'admin',  fullName: 'Mohamad (Admin)', password: 'mh123',  role: 'admin' },
    { id: '2', username: 'khodor', fullName: 'Khodor',           password: 'kd123',  role: 'user'  },
    { id: '3', username: 'user2',  fullName: 'User Two',          password: '123',    role: 'user'  },
  ];
  localStorage.setItem('app_users', JSON.stringify(defaults));
  return defaults;
};

const saveUsers = (users) => localStorage.setItem('app_users', JSON.stringify(users));

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within an AuthProvider');
  return context;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  // ── Load Roles, Users, and Current User Profile from Supabase ─────────────
  useEffect(() => {
    const initAuthData = async () => {
      try {
        // 1. Fetch roles
        const { data: rolesData, error: rolesError } = await supabase.from('roles').select('*');
        if (rolesError) {
          console.error("Supabase Roles Fetch Error:", rolesError);
          setRoles(BUILT_IN_ROLES);
        } else if (rolesData && rolesData.length > 0) {
          setRoles(rolesData);
        } else {
          setRoles(BUILT_IN_ROLES);
        }

        // 2. Fetch user profiles for the management list
        const { data: profilesData } = await supabase.from('profiles').select('*');
        if (profilesData) setUsers(profilesData.map(p => ({
          id: p.id,
          username: p.username,
          fullName: p.full_name,
          role: p.role_id,
          email: p.email
        })));

        // 3. RE-FETCH CURRENT USER PROFILE (Fixes the refresh issue)
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*, roles(permissions)')
            .eq('id', parsed.id)
            .single();

          if (error) {
            console.error("Profile refetch error:", error);
          } else if (profile) {
            const freshUser = {
              id: profile.id,
              email: profile.email,
              username: profile.username,
              fullName: profile.full_name,
              role: profile.role_id,
              permissions: { ...DEFAULT_PERMISSIONS, ...(profile.roles?.permissions || {}) }
            };
            setCurrentUser(freshUser);
            localStorage.setItem('currentUser', JSON.stringify(freshUser));
          }
        }
      } catch (err) {
        console.error("Auth init fatal error:", err);
        setRoles(BUILT_IN_ROLES); // Absolute fallback
      } finally {
        setIsLoading(false);
      }
    };
    initAuthData();
  }, []);

  // ── Resolve permissions for the logged-in user ────────────────────────────
  const currentRole = (Array.isArray(roles) && roles.length > 0) ? (
    roles.find(r => r.id === currentUser?.role) || 
    roles.find(r => r.name === 'Admin' && (currentUser?.email === 'mohamadhashem.rimex@gmail.com' || currentUser?.username === 'mohamad'))
  ) : (
    BUILT_IN_ROLES.find(r => r.id === currentUser?.role) ||
    BUILT_IN_ROLES.find(r => r.name === 'Admin' && (currentUser?.email === 'mohamadhashem.rimex@gmail.com' || currentUser?.username === 'mohamad'))
  );
  
  const permissions = { ...DEFAULT_PERMISSIONS, ...(currentRole?.permissions || {}) };
  
  // Safety fallback: If your email or username matches, you ARE an admin.
  const isAdmin = permissions.canManageUsers === true || 
                  currentUser?.email === 'mohamadhashem.rimex@gmail.com' ||
                  currentUser?.username === 'mohamad';

  // ── Auth ──────────────────────────────────────────────────────────────────

  /** Performs real Supabase Auth login (supports both email and username). */
  const login = async (identifier, password) => {
    try {
      let email = identifier;

      // 1. If the identifier is not an email, try to find the email associated with the username
      if (!identifier.includes('@')) {
        const { data: profileData, error: profileSearchError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier)
          .single();
        
        if (profileSearchError || !profileData || !profileData.email) {
          alert("Username not found or has no associated email.");
          return false;
        }

        email = profileData.email; // Use the found email to log in
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("Login failed: " + error.message);
        return false;
      }

      // 2. Fetch the profile (including role/permissions)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, roles(permissions)')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        return false;
      }

      const userToSave = {
        id: data.user.id,
        email: data.user.email,
        username: profile.username,
        fullName: profile.full_name,
        role: profile.role_id,
        permissions: { ...DEFAULT_PERMISSIONS, ...(profile.roles?.permissions || {}) }
      };

      setCurrentUser(userToSave);
      localStorage.setItem('currentUser', JSON.stringify(userToSave));
      return true;
    } catch (err) {
      console.error("Unexpected login error:", err);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  // ── Role Management ───────────────────────────────────────────────────────

  /** createRole({ name, permissions }) */
  const createRole = async ({ name, permissions: perms = {} }) => {
    if (!name?.trim()) return { success: false, error: 'Role name is required.' };

    const { data, error } = await supabase.from('roles').insert({
      name: name.trim(),
      permissions: { ...DEFAULT_PERMISSIONS, ...perms },
      built_in: false
    }).select().single();

    if (error) return { success: false, error: error.message };

    setRoles(prev => [...prev, data]); // Update UI immediately
    return { success: true, role: data };
  };

  /** updateRole(id, { name?, permissions? }) */
  const updateRole = async (id, changes) => {
    const { data, error } = await supabase.from('roles')
      .update({ 
        ...(changes.name ? { name: changes.name } : {}), 
        permissions: changes.permissions 
      })
      .eq('id', id)
      .select().single();

    if (error) return { success: false, error: error.message };

    setRoles(prev => prev.map(r => r.id === id ? data : r)); // Update UI
    return { success: true };
  };

  /** deleteRole(id) */
  const deleteRole = async (id) => {
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    setRoles(prev => prev.filter(r => r.id !== id)); // Update UI immediately
    return { success: true };
  };

  // ── User Management ───────────────────────────────────────────────────────

  const createUser = async ({ email, username, fullName, password, role = 'user' }) => {
    try {
      // 1. Create the Auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username
          }
        }
      });

      if (authError) return { success: false, error: authError.message };

      // 2. The profile is created automatically by the DB Trigger we ran earlier.
      // We just need to update the role if it's not the default.
      if (role && role !== 'user') {
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role_id: role })
          .eq('id', authData.user.id);
        
        if (roleError) console.error("Error setting role:", roleError);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * updateUser(id, changes)
   * changes can include: fullName, password, role
   */
  const updateUser = (id, changes) => {
    if (changes.role && !roles.find(r => r.id === changes.role)) {
      return { success: false, error: 'Selected role does not exist.' };
    }

    const updated = users.map(u => (u.id === id ? { ...u, ...changes } : u));
    setUsers(updated);
    saveUsers(updated);

    // Refresh session if current user was updated
    if (currentUser?.id === id) {
      const refreshed = updated.find(u => u.id === id);
      if (refreshed) {
        const safeUser = { id: refreshed.id, username: refreshed.username, fullName: refreshed.fullName, role: refreshed.role };
        setCurrentUser(safeUser);
        localStorage.setItem('currentUser', JSON.stringify(safeUser));
      }
    }
    return { success: true };
  };

  const deleteUser = (id) => {
    if (currentUser?.id === id) return { success: false, error: "You can't delete yourself." };
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    saveUsers(updated);
    return { success: true };
  };

  // ── Exposed value ─────────────────────────────────────────────────────────

  const value = {
    // Auth state
    currentUser,
    permissions,
    isAdmin,
    login,
    logout,

    // Users
    users,
    createUser,
    updateUser,
    deleteUser,

    // Roles
    roles,
    createRole,
    updateRole,
    deleteRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
