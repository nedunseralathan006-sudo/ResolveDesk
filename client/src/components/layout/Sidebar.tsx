import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Ticket, BarChart3, Settings, X, LogOut, Users, UserCog, PlusCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

import { LogoutModal } from './LogoutModal';
import { useState } from 'react';

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { sidebarOpen: isSidebarOpen, setSidebarOpen } = useUIStore();
  const closeSidebar = () => setSidebarOpen(false);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const role = user?.role;
    if (role === 'admin' || role === 'manager') {
      return [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
        { to: '/customers', icon: Users, label: 'Customers' },
        { to: '/users', icon: UserCog, label: 'Users' },
        { to: '/sla-reports', icon: BarChart3, label: 'SLA & Reports' },
        { to: '/settings', icon: Settings, label: 'Settings' },
      ];
    } else if (role === 'agent') {
      return [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
        { to: '/my-tickets', icon: Ticket, label: 'My Tickets' },
        { to: '/sla-reports', icon: BarChart3, label: 'SLA & Reports' },
        { to: '/settings', icon: Settings, label: 'Settings' },
      ];
    } else {
      // Customer
      return [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/complaints', icon: MessageSquare, label: 'My Complaints' },
        { to: '/complaints/new', icon: PlusCircle, label: 'New Complaint' },
        { to: '/settings', icon: Settings, label: 'Settings' },
      ];
    }
  };

  const navItems = getNavItems();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const roleDisplay = {
    admin: 'Admin',
    agent: 'Support Agent',
    manager: 'Manager',
    customer: 'Customer'
  };

  const userRole = user?.role ? roleDisplay[user.role as keyof typeof roleDisplay] : 'User';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#101C2B]">
      {/* Logo Area */}
      <div className="pt-16 pb-10 px-6 flex items-center justify-between">
        <div className="flex items-center text-2xl font-bold">
          <span className="text-white">Support</span>
          <span className="text-blue-600">Track</span>
        </div>
        <button className="lg:hidden text-gray-400 hover:text-white" onClick={closeSidebar}>
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => closeSidebar()}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "")} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 bg-[#1A2636] border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
              {user?.name ? getInitials(user.name) : 'U'}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400">{userRole}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-black/50 lg:hidden transition-opacity",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeSidebar}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:hidden",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-40">
        {sidebarContent}
      </div>

      <LogoutModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={handleLogout} 
      />
    </>
  );
};
