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
  canCreateUser   : false, // Can create new users
  canManageRoles  : false, // Can create/edit/delete roles
};

const BUILT_IN_ROLES = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    builtIn: true,
    permissions: {
      canUpdateStatus : true,
      canEditTask     : true,
      canDeleteTask   : true,
      canCreateTask   : true,
      canAssignTask   : true,
      canManageUsers  : true,
      canCreateUser   : true,
      canManageRoles  : true,
    },
  },
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
      canCreateUser   : false,
      canManageRoles  : false,
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
      canCreateUser   : false,
      canManageRoles  : false,
    },
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────
// NOTE: Roles and Users are now sourced from Supabase. localStorage is only
// used as a fallback for initial role display before the DB fetch completes.

const saveRoles = (roles) => localStorage.setItem('app_roles', JSON.stringify(roles));

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
      setIsLoading(true);
      console.log("[AuthInit] Starting...");
      try {
        // 1. Fetch roles
        console.log("[AuthInit] Step 1: Fetching roles...");
        const { data: rolesData, error: rolesError } = await supabase.from('roles').select('*');
        if (rolesError) {
          console.error("[AuthInit] Roles fetch error:", rolesError);
          setRoles(BUILT_IN_ROLES);
        } else if (rolesData && rolesData.length > 0) {
          console.log("[AuthInit] Roles fetched successfully:", rolesData.length);
          setRoles(rolesData);
        } else {
          console.log("[AuthInit] No roles found, using defaults");
          setRoles(BUILT_IN_ROLES);
        }

        // 2. Fetch user profiles
        console.log("[AuthInit] Step 2: Fetching profiles...");
        const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*');
        if (profilesError) {
          console.error("[AuthInit] Profiles fetch error:", profilesError);
        } else if (profilesData) {
          console.log("[AuthInit] Profiles fetched successfully:", profilesData.length);
          setUsers(profilesData.map(p => ({
            id: p.id,
            username: p.username,
            fullName: p.full_name,
            role: p.role_id,
            email: p.email
          })));
        }

        // 3. RE-FETCH CURRENT USER PROFILE
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          console.log("[AuthInit] Step 3: Refetching current user...");
          const parsed = JSON.parse(savedUser);
          const { data: profile, error: refetchError } = await supabase
            .from('profiles')
            .select('*, roles(permissions)')
            .eq('id', parsed.id)
            .single();

          if (refetchError) {
            console.error("[AuthInit] Profile refetch error:", refetchError);
          } else if (profile) {
            console.log("[AuthInit] Current user profile refreshed");
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
        console.error("[AuthInit] Fatal error during initialization:", err);
        setRoles(BUILT_IN_ROLES);
      } finally {
        console.log("[AuthInit] Initialization complete.");
        setIsLoading(false);
      }
    };
    initAuthData();
  }, []);

  // ── Resolve permissions for the logged-in user ────────────────────────────
  const currentRole = (Array.isArray(roles) && roles.length > 0) ? (
    roles.find(r => r.id === currentUser?.role) || 
    roles.find(r => r.name === 'Super Admin' && (currentUser?.email === 'mohamadhashem.rimex@gmail.com' || currentUser?.username === 'mohamad' || currentUser?.username === 'admin_new'))
  ) : (
    BUILT_IN_ROLES.find(r => r.id === currentUser?.role) ||
    BUILT_IN_ROLES.find(r => r.name === 'Super Admin' && (currentUser?.email === 'mohamadhashem.rimex@gmail.com' || currentUser?.username === 'mohamad' || currentUser?.username === 'admin_new'))
  );
  
  const permissions = { ...DEFAULT_PERMISSIONS, ...(currentRole?.permissions || {}) };
  
  // isAdmin: can manage users panel
  const isAdmin = permissions.canManageUsers === true || 
                  currentUser?.email === 'mohamadhashem.rimex@gmail.com' ||
                  currentUser?.username === 'mohamad' ||
                  currentUser?.username === 'admin_new';

  // isSuperAdmin: has full control including user creation and role management
  const isSuperAdmin = permissions.canCreateUser === true && permissions.canManageRoles === true;

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
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, roles(permissions)')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile not found, let's create it on the fly
        console.log("Profile missing, attempting to create one...");
        
        // Find the actual UUID for the 'User' role
        const defaultRole = roles.find(r => r.name.toLowerCase() === 'user');
        const defaultRoleId = defaultRole ? defaultRole.id : null;

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            username: email.split('@')[0], // Fallback username
            full_name: email.split('@')[0],
            role_id: defaultRoleId
          })
          .select('*, roles(permissions)')
          .single();

        if (createError) {
          console.error("Failed to auto-create profile:", createError);
          alert("Login successful, but failed to create user profile in database.");
          return false;
        }
        profile = newProfile;
      } else if (profileError) {
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
    localStorage.removeItem('app_users');
    localStorage.removeItem('app_roles');
    localStorage.removeItem('activeTab');
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

    setRoles(prev => [...prev, data]);
    return { success: true, role: data };
  };

  /** updateRole(id, { name?, permissions? }) */
  const updateRole = async (id, changes) => {
    const updatePayload = {};
    if (changes.name) updatePayload.name = changes.name;
    if (changes.permissions) updatePayload.permissions = changes.permissions;

    const { data, error } = await supabase.from('roles')
      .update(updatePayload)
      .eq('id', id)
      .select().single();

    if (error) return { success: false, error: error.message };

    setRoles(prev => prev.map(r => r.id === id ? data : r));
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

      // 2. We must ensure the profile exists in Supabase. 
      // Instead of relying on a potentially broken trigger, we'll manually insert/update it.
      
      // Resolve the actual UUID for the role if it's the string 'user'
      let finalRoleId = role;
      if (finalRoleId === 'user' || !finalRoleId) {
        const defaultRole = roles.find(r => r.name.toLowerCase() === 'user');
        finalRoleId = defaultRole ? defaultRole.id : null;
      }

      const { error: insertError } = await supabase
        .from('profiles')
        .upsert({ 
          id: authData.user.id,
          email: email,
          username: username,
          full_name: fullName,
          role_id: finalRoleId
        });
        
      if (insertError) {
        console.error("Error creating user profile in Supabase:", insertError);
        // We won't fail the whole process, as the auth account exists
      }

      // 3. Fetch the created profile to add to local state
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (newProfile) {
        const localUser = {
          id: newProfile.id,
          username: newProfile.username,
          fullName: newProfile.full_name,
          role: newProfile.role_id,
          email: newProfile.email
        };
        setUsers(prev => [...prev, localUser]);
      } else {
        // Fallback if profile creation was delayed
        const localUser = {
          id: authData.user.id,
          username: username,
          fullName: fullName,
          role: role,
          email: email
        };
        setUsers(prev => [...prev, localUser]);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateUser = async (id, changes) => {
    if (changes.role && !roles.find(r => r.id === changes.role)) {
      return { success: false, error: 'Selected role does not exist.' };
    }

    // 1. Update Supabase Profile
    const dbChanges = {};
    if (changes.fullName !== undefined) dbChanges.full_name = changes.fullName;
    if (changes.role) dbChanges.role_id = changes.role;

    if (Object.keys(dbChanges).length > 0) {
      const { error } = await supabase.from('profiles').update(dbChanges).eq('id', id);
      if (error) return { success: false, error: error.message };
    }

    // 2. Password update is not supported from the admin panel without a Service Role key.
    if (changes.password) {
      console.warn("Password changes for other users require a Service Role key on the backend.");
    }

    // 3. Re-fetch fresh profiles from Supabase to reflect DB truth
    const { data: profilesData } = await supabase.from('profiles').select('*');
    if (profilesData) {
      const freshUsers = profilesData.map(p => ({
        id: p.id,
        username: p.username,
        fullName: p.full_name,
        role: p.role_id,
        email: p.email
      }));
      setUsers(freshUsers);

      // Refresh session if current user was updated
      if (currentUser?.id === id) {
        const refreshed = freshUsers.find(u => u.id === id);
        if (refreshed) {
          const { data: profileWithRole } = await supabase
            .from('profiles')
            .select('*, roles(permissions)')
            .eq('id', id)
            .single();
          const safeUser = {
            id: refreshed.id,
            username: refreshed.username,
            fullName: refreshed.fullName,
            role: refreshed.role,
            email: refreshed.email,
            permissions: { ...DEFAULT_PERMISSIONS, ...(profileWithRole?.roles?.permissions || {}) }
          };
          setCurrentUser(safeUser);
          localStorage.setItem('currentUser', JSON.stringify(safeUser));
        }
      }
    }

    return { success: true };
  };

  const deleteUser = async (id) => {
    if (currentUser?.id === id) return { success: false, error: "You can't delete yourself." };
    
    // 1. Delete from Supabase profiles
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    // 2. Re-fetch fresh profiles from Supabase so the UI reflects DB truth
    const { data: profilesData } = await supabase.from('profiles').select('*');
    if (profilesData) {
      setUsers(profilesData.map(p => ({
        id: p.id,
        username: p.username,
        fullName: p.full_name,
        role: p.role_id,
        email: p.email
      })));
    } else {
      // Fallback: optimistically remove from local state
      setUsers(prev => prev.filter(u => u.id !== id));
    }
    return { success: true };
  };

  // ── Exposed value ─────────────────────────────────────────────────────────

  const value = {
    // Auth state
    currentUser,
    isLoading,
    permissions,
    isAdmin,
    isSuperAdmin,
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
