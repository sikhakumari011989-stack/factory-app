import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, Tenant, ProvisionedTenant } from '../types';
import { INITIAL_TENANT } from '../utils/mockData';
import { provisionNewFactory, ProvisionFactoryParams } from '../lib/firestoreService';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  tenant: Tenant;
  provisionedTenants: ProvisionedTenant[];
  login: (role: UserRole, contractorId?: string, email?: string) => void;
  loginWithCredentials: (email: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  switchRole: (newRole: UserRole, contractorId?: string) => void;
  updateTenant: (tenant: Partial<Tenant>) => void;
  selectTenant: (tenantId: string) => void;
  registerProvisionedFactory: (params: ProvisionFactoryParams) => Promise<ProvisionedTenant>;
}

const DEMO_USERS: Record<UserRole, UserProfile> = {
  admin: {
    id: 'usr-admin-1',
    name: 'Vikramaditya Singhania',
    email: 'admin@apexfactory.com',
    role: 'admin',
    tenantId: INITIAL_TENANT.id,
  },
  guard: {
    id: 'usr-guard-1',
    name: 'Santosh Shinde (Gate #2)',
    email: 'gate2.guard@apexfactory.com',
    role: 'guard',
    tenantId: INITIAL_TENANT.id,
  },
  contractor: {
    id: 'usr-contractor-1',
    name: 'Rajesh Sharma (Agency Supervisor)',
    email: 'rajesh@apexlabour.in',
    role: 'contractor',
    contractorId: 'cnt-1',
    tenantId: INITIAL_TENANT.id,
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('factory_user_role') as UserRole) || 'admin';
  });

  const [tenant, setTenant] = useState<Tenant>(() => {
    try {
      const saved = localStorage.getItem('factory_tenant_info');
      return saved ? JSON.parse(saved) : INITIAL_TENANT;
    } catch {
      return INITIAL_TENANT;
    }
  });

  const [provisionedTenants, setProvisionedTenants] = useState<ProvisionedTenant[]>(() => {
    try {
      const saved = localStorage.getItem('factory_provisioned_tenants');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedRole = (localStorage.getItem('factory_user_role') as UserRole) || 'admin';
    return DEMO_USERS[savedRole] || DEMO_USERS.admin;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('factory_user_role', user.role);
    }
  }, [user]);

  const login = (newRole: UserRole, contractorId?: string, email?: string) => {
    const base = DEMO_USERS[newRole];
    const newUser: UserProfile = {
      ...base,
      contractorId: contractorId || base.contractorId,
      email: email || base.email,
      tenantId: tenant.id,
    };
    setUser(newUser);
    setRole(newRole);
    localStorage.setItem('factory_user_role', newRole);
  };

  const loginWithCredentials = (email: string, password?: string): { success: boolean; message?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check in provisioned tenants
    const match = provisionedTenants.find(
      (p) => p.ownerEmail.toLowerCase() === cleanEmail
    );

    if (match) {
      if (match.temporaryPassword && password && match.temporaryPassword !== password) {
        return { success: false, message: 'Invalid password. Please check your credentials.' };
      }

      setTenant(match.tenant);
      localStorage.setItem('factory_tenant_info', JSON.stringify(match.tenant));

      const newUser: UserProfile = {
        id: `usr-${match.tenant.id}`,
        name: match.ownerName,
        email: match.ownerEmail,
        role: 'admin',
        tenantId: match.tenant.id,
      };
      setUser(newUser);
      setRole('admin');
      localStorage.setItem('factory_user_role', 'admin');
      return { success: true };
    }

    // Fallback to demo users
    if (cleanEmail === 'admin@apexfactory.com') {
      login('admin', undefined, cleanEmail);
      return { success: true };
    }
    if (cleanEmail === 'gate2.guard@apexfactory.com') {
      login('guard', undefined, cleanEmail);
      return { success: true };
    }
    if (cleanEmail.includes('agency') || cleanEmail.includes('contractor') || cleanEmail === 'rajesh@apexlabour.in') {
      login('contractor', undefined, cleanEmail);
      return { success: true };
    }

    // Default admin entry for custom email
    const customUser: UserProfile = {
      id: `usr-custom-${Date.now()}`,
      name: cleanEmail.split('@')[0].toUpperCase(),
      email: cleanEmail,
      role: 'admin',
      tenantId: tenant.id,
    };
    setUser(customUser);
    setRole('admin');
    localStorage.setItem('factory_user_role', 'admin');
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('factory_user_role');
  };

  const switchRole = (newRole: UserRole, contractorId?: string) => {
    login(newRole, contractorId);
  };

  const updateTenant = (updates: Partial<Tenant>) => {
    setTenant((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('factory_tenant_info', JSON.stringify(next));
      return next;
    });
  };

  const selectTenant = (tenantId: string) => {
    if (tenantId === INITIAL_TENANT.id) {
      setTenant(INITIAL_TENANT);
      localStorage.setItem('factory_tenant_info', JSON.stringify(INITIAL_TENANT));
      return;
    }
    const found = provisionedTenants.find((p) => p.tenant.id === tenantId);
    if (found) {
      setTenant(found.tenant);
      localStorage.setItem('factory_tenant_info', JSON.stringify(found.tenant));
      if (user) {
        setUser((prev) => (prev ? { ...prev, tenantId: found.tenant.id } : null));
      }
    }
  };

  const registerProvisionedFactory = async (params: ProvisionFactoryParams): Promise<ProvisionedTenant> => {
    const res = await provisionNewFactory(params);
    const item: ProvisionedTenant = {
      tenant: res.tenant,
      ownerEmail: res.ownerUser.email,
      temporaryPassword: params.password || 'Factory@123',
      ownerName: res.ownerUser.name,
      createdAt: new Date().toISOString(),
    };

    setProvisionedTenants((prev) => {
      const filtered = prev.filter((p) => p.tenant.id !== item.tenant.id);
      const updated = [...filtered, item];
      localStorage.setItem('factory_provisioned_tenants', JSON.stringify(updated));
      return updated;
    });

    setTenant(res.tenant);
    localStorage.setItem('factory_tenant_info', JSON.stringify(res.tenant));

    const newUser: UserProfile = {
      id: res.ownerUser.id,
      name: res.ownerUser.name,
      email: res.ownerUser.email,
      role: 'admin',
      tenantId: res.tenant.id,
    };
    setUser(newUser);
    setRole('admin');
    localStorage.setItem('factory_user_role', 'admin');

    return item;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : role,
        tenant,
        provisionedTenants,
        login,
        loginWithCredentials,
        logout,
        switchRole,
        updateTenant,
        selectTenant,
        registerProvisionedFactory,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
