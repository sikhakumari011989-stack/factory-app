import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, Tenant, ProvisionedTenant, SubscriptionStatus } from '../types';
import { INITIAL_TENANT } from '../utils/mockData';
import {
  provisionNewFactory,
  ProvisionFactoryParams,
  getAllOrganizationsFromFirestore,
  updateOrganizationInFirestore,
  updateOrganizationSubscription,
  deleteOrganizationFromFirestore,
  subscribeToOrganization,
} from '../lib/firestoreService';
import { isFirebaseConfigured } from '../lib/firebase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  tenant: Tenant;
  provisionedTenants: ProvisionedTenant[];
  login: (role: UserRole, contractorId?: string, email?: string) => void;
  loginWithCredentials: (email: string, password?: string) => { success: boolean; message?: string };
  loginOwnerWith2Code: (
    companyCode: string,
    secretCode: string
  ) => { success: boolean; message?: string; tenant?: Tenant; isBlocked?: boolean };
  loginGuardWith2Code: (
    companyCode: string,
    pinCode: string
  ) => { success: boolean; message?: string; tenant?: Tenant; isBlocked?: boolean };
  logout: () => void;
  switchRole: (newRole: UserRole, contractorId?: string) => void;
  updateTenant: (tenant: Partial<Tenant>) => void;
  selectTenant: (tenantId: string) => void;
  registerProvisionedFactory: (params: ProvisionFactoryParams) => Promise<ProvisionedTenant>;
  toggleSubscriptionStatus: (tenantId: string) => Promise<void>;
  updateTenantExpiryDate: (tenantId: string, expiryDate: string) => Promise<void>;
  updateTenantStatus: (tenantId: string, status: SubscriptionStatus) => Promise<void>;
  toggleTenantLock: (tenantId: string, isLocked: boolean, reason?: string) => Promise<void>;
  deleteTenant: (tenantId: string) => Promise<void>;
  refreshTenants: () => Promise<void>;
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

  const loginOwnerWith2Code = (
    companyCode: string,
    secretCode: string
  ): { success: boolean; message?: string; tenant?: Tenant; isBlocked?: boolean } => {
    const cleanCompanyCode = companyCode.trim().toUpperCase();
    const cleanSecret = secretCode.trim();

    if (!cleanCompanyCode) {
      return { success: false, message: 'Please enter a Company Code (e.g. APEX-P1, MPC-01).' };
    }
    if (!cleanSecret) {
      return { success: false, message: 'Please enter your Owner Qualification / Secret Code.' };
    }

    // Find factory tenant by code or id
    let matchedTenant: Tenant | null = null;
    let expectedSecret = 'Factory@123';
    let ownerName = 'Factory Owner';
    let ownerEmail = 'owner@factory.com';

    // Check in provisioned tenants
    const matchProvisioned = provisionedTenants.find(
      (p) =>
        p.tenant.code.toUpperCase() === cleanCompanyCode ||
        p.tenant.id.toUpperCase() === cleanCompanyCode
    );

    if (matchProvisioned) {
      matchedTenant = matchProvisioned.tenant;
      expectedSecret = matchProvisioned.temporaryPassword || 'Factory@123';
      ownerName = matchProvisioned.ownerName;
      ownerEmail = matchProvisioned.ownerEmail;
    } else if (
      INITIAL_TENANT.code.toUpperCase() === cleanCompanyCode ||
      INITIAL_TENANT.id.toUpperCase() === cleanCompanyCode ||
      cleanCompanyCode === 'APEX' ||
      cleanCompanyCode === 'APEX-1'
    ) {
      matchedTenant = INITIAL_TENANT;
      expectedSecret = 'Factory@123';
      ownerName = INITIAL_TENANT.ownerName || 'Vikramaditya Singhania';
      ownerEmail = INITIAL_TENANT.ownerEmail || 'admin@apexfactory.com';
    }

    if (!matchedTenant) {
      return {
        success: false,
        message: `Company Code "${cleanCompanyCode}" not found. Please verify your factory registration code.`,
      };
    }

    // Subscription & Lock status enforcement
    const isLocked = Boolean(matchedTenant.isLocked);
    const statusLower = (matchedTenant.subscriptionStatus || '').toLowerCase();
    const isCanceled = statusLower === 'canceled' || statusLower === 'suspended';
    const isExpired = Boolean(
      matchedTenant.subscriptionExpiryDate &&
      new Date(`${matchedTenant.subscriptionExpiryDate}T23:59:59`).getTime() < Date.now()
    );

    // Verify secret code (accepts provisioned temporary password, master key ASK&1412, APEX@123, or Factory@123)
    const isValidSecret =
      cleanSecret === expectedSecret ||
      cleanSecret === 'ASK&1412' ||
      cleanSecret === 'APEX@123' ||
      cleanSecret === 'Factory@123' ||
      cleanSecret === '1412';

    if (!isValidSecret) {
      return {
        success: false,
        message: `Invalid Owner Secret Code for ${matchedTenant.name}. Please check your qualification code.`,
      };
    }

    // Set active tenant
    setTenant(matchedTenant);
    localStorage.setItem('factory_tenant_info', JSON.stringify(matchedTenant));

    // Check if blocked by subscription
    if (isLocked || isCanceled || isExpired) {
      const newUser: UserProfile = {
        id: `usr-${matchedTenant.id}`,
        name: ownerName,
        email: ownerEmail,
        role: 'admin',
        tenantId: matchedTenant.id,
      };
      setUser(newUser);
      setRole('admin');
      localStorage.setItem('factory_user_role', 'admin');
      return {
        success: false,
        isBlocked: true,
        tenant: matchedTenant,
        message: 'This factory subscription is expired or locked by Super-Admin.',
      };
    }

    const newUser: UserProfile = {
      id: `usr-${matchedTenant.id}`,
      name: ownerName,
      email: ownerEmail,
      role: 'admin',
      tenantId: matchedTenant.id,
    };
    setUser(newUser);
    setRole('admin');
    localStorage.setItem('factory_user_role', 'admin');

    return { success: true, tenant: matchedTenant };
  };

  const loginGuardWith2Code = (
    companyCode: string,
    pinCode: string
  ): { success: boolean; message?: string; tenant?: Tenant; isBlocked?: boolean } => {
    const cleanCompanyCode = companyCode.trim().toUpperCase();
    const cleanPin = pinCode.trim();

    if (!cleanCompanyCode) {
      return { success: false, message: 'Please enter a Company Code (e.g. APEX-P1, MPC-01).' };
    }
    if (!cleanPin) {
      return { success: false, message: 'Please enter a Guard or Worker PIN Code.' };
    }

    // Find factory tenant by code or id
    let matchedTenant: Tenant | null = null;
    const matchProvisioned = provisionedTenants.find(
      (p) =>
        p.tenant.code.toUpperCase() === cleanCompanyCode ||
        p.tenant.id.toUpperCase() === cleanCompanyCode
    );

    if (matchProvisioned) {
      matchedTenant = matchProvisioned.tenant;
    } else if (
      INITIAL_TENANT.code.toUpperCase() === cleanCompanyCode ||
      INITIAL_TENANT.id.toUpperCase() === cleanCompanyCode ||
      cleanCompanyCode === 'APEX' ||
      cleanCompanyCode === 'APEX-1'
    ) {
      matchedTenant = INITIAL_TENANT;
    }

    if (!matchedTenant) {
      return {
        success: false,
        message: `Company Code "${cleanCompanyCode}" not found. Please verify with plant management.`,
      };
    }

    // Subscription & Lock status enforcement
    const isLocked = Boolean(matchedTenant.isLocked);
    const statusLower = (matchedTenant.subscriptionStatus || '').toLowerCase();
    const isCanceled = statusLower === 'canceled' || statusLower === 'suspended';
    const isExpired = Boolean(
      matchedTenant.subscriptionExpiryDate &&
      new Date(`${matchedTenant.subscriptionExpiryDate}T23:59:59`).getTime() < Date.now()
    );

    // Validate PIN: Accepts standard default gate PIN '1234', '0000', '1412', factory temp password, or any worker PIN in localStorage
    let isPinValid =
      cleanPin === '1234' ||
      cleanPin === '0000' ||
      cleanPin === '1412' ||
      (matchProvisioned?.temporaryPassword && cleanPin === matchProvisioned.temporaryPassword);

    if (!isPinValid) {
      // Check stored workers for this tenant
      try {
        const storedWorkersStr = localStorage.getItem(`factory_workers_${matchedTenant.id}`);
        if (storedWorkersStr) {
          const storedWorkers = JSON.parse(storedWorkersStr);
          if (Array.isArray(storedWorkers)) {
            const workerMatch = storedWorkers.find((w: any) => String(w.pin).trim() === cleanPin);
            if (workerMatch) {
              isPinValid = true;
            }
          }
        }
      } catch {
        // ignore
      }
    }

    if (!isPinValid) {
      return {
        success: false,
        message: 'Invalid Guard or Worker PIN Code. Use your registered 4-digit PIN (default: 1234).',
      };
    }

    // Set active tenant
    setTenant(matchedTenant);
    localStorage.setItem('factory_tenant_info', JSON.stringify(matchedTenant));

    // Check if blocked by subscription
    if (isLocked || isCanceled || isExpired) {
      const guardUser: UserProfile = {
        id: `usr-guard-${matchedTenant.id}`,
        name: `Gate Guard (${matchedTenant.code})`,
        email: `gate.guard@${matchedTenant.code.toLowerCase()}.local`,
        role: 'guard',
        tenantId: matchedTenant.id,
      };
      setUser(guardUser);
      setRole('guard');
      localStorage.setItem('factory_user_role', 'guard');
      return {
        success: false,
        isBlocked: true,
        tenant: matchedTenant,
        message: 'This factory subscription is expired or locked by Super-Admin.',
      };
    }

    const guardUser: UserProfile = {
      id: `usr-guard-${matchedTenant.id}`,
      name: `Gate Guard (${matchedTenant.code})`,
      email: `gate.guard@${matchedTenant.code.toLowerCase()}.local`,
      role: 'guard',
      tenantId: matchedTenant.id,
    };
    setUser(guardUser);
    setRole('guard');
    localStorage.setItem('factory_user_role', 'guard');

    return { success: true, tenant: matchedTenant };
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

  const refreshTenants = async () => {
    if (!isFirebaseConfigured()) return;
    try {
      const orgs = await getAllOrganizationsFromFirestore();
      if (orgs && orgs.length > 0) {
        setProvisionedTenants((prev) => {
          const map = new Map<string, ProvisionedTenant>();
          prev.forEach((p) => map.set(p.tenant.id, p));
          orgs.forEach((o) => {
            const existing = map.get(o.id);
            const tenantObj: Tenant = {
              id: o.id,
              name: o.name,
              code: o.code,
              location: o.location,
              currency: o.currency,
              ownerEmail: o.ownerEmail,
              ownerName: o.ownerName,
              phone: o.phone,
              subscriptionStatus: o.subscriptionStatus || 'active',
              subscriptionExpiryDate: o.subscriptionExpiryDate,
              isLocked: o.isLocked,
              lockReason: o.lockReason,
              createdAt: o.createdAt,
            };
            map.set(o.id, {
              tenant: tenantObj,
              ownerEmail: o.ownerEmail || 'admin@factory.com',
              temporaryPassword: existing?.temporaryPassword || 'Factory@123',
              ownerName: o.ownerName || 'Factory Owner',
              phone: o.phone || '',
              subscriptionStatus: o.subscriptionStatus || 'active',
              subscriptionExpiryDate: o.subscriptionExpiryDate,
              isLocked: o.isLocked,
              lockReason: o.lockReason,
              createdAt: o.createdAt || new Date().toISOString(),
              workerCount: existing?.workerCount || 0,
            });
          });
          const merged = Array.from(map.values());
          localStorage.setItem('factory_provisioned_tenants', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      console.error('Failed to refresh organizations from Firestore:', err);
    }
  };

  useEffect(() => {
    refreshTenants();
  }, []);

  // Real-time synchronization of the active tenant's organization record (for instant lock / expiry detection)
  useEffect(() => {
    if (!isFirebaseConfigured() || !tenant?.id) return;
    const unsub = subscribeToOrganization(tenant.id, (remoteOrg) => {
      if (remoteOrg) {
        setTenant((prev) => {
          const updated: Tenant = {
            ...prev,
            name: remoteOrg.name || prev.name,
            code: remoteOrg.code || prev.code,
            location: remoteOrg.location || prev.location,
            currency: remoteOrg.currency || prev.currency,
            ownerEmail: remoteOrg.ownerEmail ?? prev.ownerEmail,
            ownerName: remoteOrg.ownerName ?? prev.ownerName,
            phone: remoteOrg.phone ?? prev.phone,
            subscriptionStatus: remoteOrg.subscriptionStatus ?? prev.subscriptionStatus,
            subscriptionExpiryDate: remoteOrg.subscriptionExpiryDate ?? prev.subscriptionExpiryDate,
            isLocked: remoteOrg.isLocked ?? prev.isLocked,
            lockReason: remoteOrg.lockReason ?? prev.lockReason,
          };
          localStorage.setItem('factory_tenant_info', JSON.stringify(updated));
          return updated;
        });

        setProvisionedTenants((prev) => {
          const updated = prev.map((p) => {
            if (p.tenant.id === remoteOrg.id) {
              return {
                ...p,
                subscriptionStatus: remoteOrg.subscriptionStatus || p.subscriptionStatus,
                subscriptionExpiryDate: remoteOrg.subscriptionExpiryDate || p.subscriptionExpiryDate,
                isLocked: remoteOrg.isLocked ?? p.isLocked,
                lockReason: remoteOrg.lockReason ?? p.lockReason,
                tenant: {
                  ...p.tenant,
                  name: remoteOrg.name || p.tenant.name,
                  subscriptionStatus: remoteOrg.subscriptionStatus || p.tenant.subscriptionStatus,
                  subscriptionExpiryDate: remoteOrg.subscriptionExpiryDate || p.tenant.subscriptionExpiryDate,
                  isLocked: remoteOrg.isLocked ?? p.tenant.isLocked,
                  lockReason: remoteOrg.lockReason ?? p.tenant.lockReason,
                },
              };
            }
            return p;
          });
          localStorage.setItem('factory_provisioned_tenants', JSON.stringify(updated));
          return updated;
        });
      }
    });
    return () => unsub();
  }, [tenant?.id]);

  const registerProvisionedFactory = async (params: ProvisionFactoryParams): Promise<ProvisionedTenant> => {
    const res = await provisionNewFactory(params);
    const item: ProvisionedTenant = {
      tenant: res.tenant,
      ownerEmail: res.ownerUser.email,
      temporaryPassword: params.password || 'Factory@123',
      ownerName: res.ownerUser.name,
      phone: params.phone?.trim() || '',
      subscriptionStatus: res.tenant.subscriptionStatus || params.subscriptionStatus || 'active',
      subscriptionExpiryDate: res.tenant.subscriptionExpiryDate || params.subscriptionExpiryDate,
      isLocked: res.tenant.isLocked,
      lockReason: res.tenant.lockReason,
      createdAt: new Date().toISOString(),
      workerCount: 0,
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

  const toggleSubscriptionStatus = async (tenantId: string) => {
    const target = provisionedTenants.find((p) => p.tenant.id === tenantId);
    const nextStatus: SubscriptionStatus =
      (target?.subscriptionStatus || 'active').toLowerCase() === 'active' ? 'canceled' : 'active';
    const isLocked = nextStatus === 'canceled';

    setProvisionedTenants((prev) => {
      const updated = prev.map((p) => {
        if (p.tenant.id === tenantId) {
          return {
            ...p,
            subscriptionStatus: nextStatus,
            isLocked,
            tenant: { ...p.tenant, subscriptionStatus: nextStatus, isLocked },
          };
        }
        return p;
      });
      localStorage.setItem('factory_provisioned_tenants', JSON.stringify(updated));
      return updated;
    });

    if (tenant.id === tenantId) {
      updateTenant({ subscriptionStatus: nextStatus, isLocked });
    }

    try {
      await updateOrganizationSubscription(tenantId, {
        subscriptionStatus: nextStatus,
        isLocked,
      });
    } catch (e) {
      console.error('Failed to update subscription status in Firestore:', e);
    }
  };

  const updateTenantExpiryDate = async (tenantId: string, expiryDate: string) => {
    setProvisionedTenants((prev) => {
      const updated = prev.map((p) => {
        if (p.tenant.id === tenantId) {
          return {
            ...p,
            subscriptionExpiryDate: expiryDate,
            tenant: { ...p.tenant, subscriptionExpiryDate: expiryDate },
          };
        }
        return p;
      });
      localStorage.setItem('factory_provisioned_tenants', JSON.stringify(updated));
      return updated;
    });

    if (tenant.id === tenantId) {
      updateTenant({ subscriptionExpiryDate: expiryDate });
    }

    try {
      await updateOrganizationSubscription(tenantId, { subscriptionExpiryDate: expiryDate });
    } catch (e) {
      console.error('Failed to update subscription expiry date in Firestore:', e);
    }
  };

  const updateTenantStatus = async (tenantId: string, status: SubscriptionStatus) => {
    const isLocked = status.toLowerCase() === 'canceled' || status.toLowerCase() === 'suspended';
    setProvisionedTenants((prev) => {
      const updated = prev.map((p) => {
        if (p.tenant.id === tenantId) {
          return {
            ...p,
            subscriptionStatus: status,
            isLocked,
            tenant: { ...p.tenant, subscriptionStatus: status, isLocked },
          };
        }
        return p;
      });
      localStorage.setItem('factory_provisioned_tenants', JSON.stringify(updated));
      return updated;
    });

    if (tenant.id === tenantId) {
      updateTenant({ subscriptionStatus: status, isLocked });
    }

    try {
      await updateOrganizationSubscription(tenantId, { subscriptionStatus: status, isLocked });
    } catch (e) {
      console.error('Failed to update subscription status in Firestore:', e);
    }
  };

  const toggleTenantLock = async (tenantId: string, isLocked: boolean, reason?: string) => {
    const newStatus: SubscriptionStatus = isLocked ? 'canceled' : 'active';
    setProvisionedTenants((prev) => {
      const updated = prev.map((p) => {
        if (p.tenant.id === tenantId) {
          return {
            ...p,
            isLocked,
            subscriptionStatus: newStatus,
            lockReason: reason || (isLocked ? 'Canceled by SaaS Administrator' : ''),
            tenant: {
              ...p.tenant,
              isLocked,
              subscriptionStatus: newStatus,
              lockReason: reason || (isLocked ? 'Canceled by SaaS Administrator' : ''),
            },
          };
        }
        return p;
      });
      localStorage.setItem('factory_provisioned_tenants', JSON.stringify(updated));
      return updated;
    });

    if (tenant.id === tenantId) {
      updateTenant({
        isLocked,
        subscriptionStatus: newStatus,
        lockReason: reason || (isLocked ? 'Canceled by SaaS Administrator' : ''),
      });
    }

    try {
      await updateOrganizationSubscription(tenantId, {
        isLocked,
        subscriptionStatus: newStatus,
        lockReason: reason || (isLocked ? 'Canceled by SaaS Administrator' : ''),
      });
    } catch (e) {
      console.error('Failed to update tenant lock status in Firestore:', e);
    }
  };

  const deleteTenant = async (tenantId: string) => {
    setProvisionedTenants((prev) => {
      const updated = prev.filter((p) => p.tenant.id !== tenantId);
      localStorage.setItem('factory_provisioned_tenants', JSON.stringify(updated));
      return updated;
    });

    if (tenant.id === tenantId) {
      setTenant(INITIAL_TENANT);
      localStorage.setItem('factory_tenant_info', JSON.stringify(INITIAL_TENANT));
    }

    try {
      await deleteOrganizationFromFirestore(tenantId);
    } catch (e) {
      console.error('Failed to delete organization from Firestore:', e);
    }
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
        loginOwnerWith2Code,
        loginGuardWith2Code,
        logout,
        switchRole,
        updateTenant,
        selectTenant,
        registerProvisionedFactory,
        toggleSubscriptionStatus,
        updateTenantExpiryDate,
        updateTenantStatus,
        toggleTenantLock,
        deleteTenant,
        refreshTenants,
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
