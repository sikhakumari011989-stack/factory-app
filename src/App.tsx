import React, { useState, useEffect } from 'react';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FactoryProvider } from './context/FactoryContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { MasterCreatorPortal } from './components/admin/MasterCreatorPortal';
import { SubscriptionLockedScreen } from './components/common/SubscriptionLockedScreen';
import { FirebaseConfigModal } from './components/common/FirebaseConfigModal';
import { PwaInstallBanner } from './components/common/PwaInstallBanner';
import { UnifiedFactoryDashboard } from './components/dashboard/UnifiedFactoryDashboard';
import { OfflineSyncBanner } from './components/common/OfflineSyncBanner';
import { LayoutDashboard } from 'lucide-react';

export type MainAppView =
  | 'dashboard'
  | 'engine'
  | 'payroll'
  | 'registry'
  | 'kiosk'
  | 'login'
  | 'owner-login'
  | 'guard-login'
  | 'master-creator';

const isMasterCreatorRoute = () => {
  return (
    typeof window !== 'undefined' &&
    (window.location.pathname === '/master-creator' ||
      window.location.pathname.startsWith('/master-creator') ||
      window.location.hash.includes('master-creator'))
  );
};

const isOwnerLoginRoute = () => {
  return (
    typeof window !== 'undefined' &&
    (window.location.pathname === '/owner-login' ||
      window.location.pathname.startsWith('/owner-login') ||
      window.location.hash.includes('owner-login'))
  );
};

const isGuardLoginRoute = () => {
  return (
    typeof window !== 'undefined' &&
    (window.location.pathname === '/guard-login' ||
      window.location.pathname.startsWith('/guard-login') ||
      window.location.hash.includes('guard-login'))
  );
};

const MainAppContent: React.FC = () => {
  const { user, role, tenant, logout } = useAuth();
  const [currentView, setCurrentView] = useState<MainAppView>(() => {
    if (isMasterCreatorRoute()) return 'master-creator';
    if (isOwnerLoginRoute()) return 'owner-login';
    if (isGuardLoginRoute()) return 'guard-login';
    return 'dashboard';
  });
  const [showDbModal, setShowDbModal] = useState(false);

  // Sync URL changes with route
  useEffect(() => {
    const handleUrlChange = () => {
      if (isMasterCreatorRoute()) {
        setCurrentView('master-creator');
      } else if (isOwnerLoginRoute()) {
        setCurrentView('owner-login');
      } else if (isGuardLoginRoute()) {
        setCurrentView('guard-login');
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const navigateToView = (view: MainAppView) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      if (view === 'master-creator') {
        if (window.location.pathname !== '/master-creator') {
          window.history.pushState(null, '', '/master-creator');
        }
      } else if (view === 'owner-login') {
        if (window.location.pathname !== '/owner-login') {
          window.history.pushState(null, '', '/owner-login');
        }
      } else if (view === 'guard-login') {
        if (window.location.pathname !== '/guard-login') {
          window.history.pushState(null, '', '/guard-login');
        }
      } else if (view === 'login') {
        if (window.location.pathname !== '/login') {
          window.history.pushState(null, '', '/login');
        }
      } else {
        if (
          window.location.pathname === '/master-creator' ||
          window.location.pathname === '/owner-login' ||
          window.location.pathname === '/guard-login' ||
          window.location.pathname === '/login' ||
          window.location.hash
        ) {
          window.history.pushState(null, '', '/');
        }
      }
    }
  };

  // Master Creator Portal View (Password Gate Protected - Never blocked)
  if (currentView === 'master-creator') {
    return (
      <MasterCreatorPortal
        onExit={() => {
          if (user) {
            navigateToView(role === 'guard' ? 'dashboard' : 'dashboard');
          } else {
            navigateToView('owner-login');
          }
        }}
        onEnterAsOwner={() => {
          navigateToView('dashboard');
        }}
      />
    );
  }

  // Real-time Subscription Lock & Manual Expiration Enforcement
  const isLocked = Boolean(tenant?.isLocked);
  const statusLower = (tenant?.subscriptionStatus || '').toLowerCase();
  const isCanceled = statusLower === 'canceled';
  const isSuspended = statusLower === 'suspended';
  const isExpired = Boolean(
    tenant?.subscriptionExpiryDate &&
    new Date(`${tenant.subscriptionExpiryDate}T23:59:59`).getTime() < Date.now()
  );

  const isBlocked = isLocked || isCanceled || isSuspended || isExpired;

  const isAuthRoute =
    currentView === 'login' ||
    currentView === 'owner-login' ||
    currentView === 'guard-login';

  // If blocked, render the un-dismissible lock screen
  if (isBlocked && !isAuthRoute) {
    let blockReason: 'expired' | 'canceled' | 'suspended' | 'locked' = 'locked';
    let blockMessage = tenant?.lockReason || 'Access to this industrial instance has been restricted.';

    if (isCanceled) {
      blockReason = 'canceled';
      blockMessage = tenant?.lockReason || 'The software license for this factory has been canceled.';
    } else if (isSuspended) {
      blockReason = 'suspended';
      blockMessage = tenant?.lockReason || 'This factory account has been temporarily suspended.';
    } else if (isExpired) {
      blockReason = 'expired';
      blockMessage = `Subscription expired on ${tenant?.subscriptionExpiryDate}. Contact SaaS Admin to renew license.`;
    } else if (isLocked) {
      blockReason = 'locked';
      blockMessage = tenant?.lockReason || 'This factory instance has been locked in real-time by the Super-Admin.';
    }

    return (
      <SubscriptionLockedScreen
        tenant={tenant}
        blockReason={blockReason}
        message={blockMessage}
        onOpenMasterCreator={() => navigateToView('master-creator')}
        onSwitchFactory={() => {
          logout();
          navigateToView('owner-login');
        }}
        onSignOut={() => {
          logout();
          navigateToView('owner-login');
        }}
      />
    );
  }

  // Dedicated 2-Code Auth Portals (/owner-login, /guard-login, /login)
  if (!user || isAuthRoute) {
    return (
      <div className="relative min-h-screen">
        {user && (
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={() => navigateToView('dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-lg backdrop-blur-md transition-all cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              <span>Back to Active Session</span>
            </button>
          </div>
        )}
        <AuthScreen
          initialMode={currentView === 'guard-login' ? 'guard' : 'owner'}
          onNavigateMode={(mode) => {
            navigateToView(mode === 'guard' ? 'guard-login' : 'owner-login');
          }}
          onSuccess={() => {
            navigateToView('dashboard');
          }}
          onOpenMasterCreator={() => navigateToView('master-creator')}
        />
      </div>
    );
  }

  // Guard Mode: Simple, clean daily attendance list where guard can toggle Present/Absent with 1 tap!
  if (role === 'guard') {
    return (
      <>
        <OfflineSyncBanner />
        <UnifiedFactoryDashboard
          isGuardMode={true}
          onSignOut={() => {
            logout();
            navigateToView('guard-login');
          }}
        />
        <PwaInstallBanner />
      </>
    );
  }

  // Owner / Manager Mode: Unified Single Dashboard
  // Everything on one screen: Worker list, 1-tap attendance toggles, and total wage summaries!
  return (
    <>
      <OfflineSyncBanner />
      <UnifiedFactoryDashboard
        isGuardMode={false}
        onOpenSettings={() => setShowDbModal(true)}
        onNavigateToCreator={() => navigateToView('master-creator')}
        onSignOut={() => {
          logout();
          navigateToView('owner-login');
        }}
      />

      {/* Firebase Cloud Firestore Settings Modal */}
      <FirebaseConfigModal
        isOpen={showDbModal}
        onClose={() => setShowDbModal(false)}
      />

      {/* PWA Install Banner */}
      <PwaInstallBanner />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FactoryProvider>
        <MainAppContent />
      </FactoryProvider>
    </AuthProvider>
  );
}
