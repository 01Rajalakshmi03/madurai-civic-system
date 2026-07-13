import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome, FiClipboard, FiMap, FiBarChart2, FiUsers,
  FiSettings, FiShield, FiBell, FiLogOut, FiGrid,
  FiAward, FiFileText, FiActivity
} from 'react-icons/fi';

const citizenLinks = [
  { to: '/dashboard', icon: FiHome, label: 'Dashboard', end: true },
  { to: '/dashboard/new-complaint', icon: FiClipboard, label: 'Report Issue' },
  { to: '/dashboard/my-complaints', icon: FiGrid, label: 'My Complaints' },
  { to: '/dashboard/track', icon: FiActivity, label: 'Track Complaint' },
  { to: '/dashboard/map', icon: FiMap, label: 'Issue Map' },
  { to: '/dashboard/notifications', icon: FiBell, label: 'Notifications' },
];

const wardLinks = [
  { to: '/dashboard', icon: FiHome, label: 'Dashboard', end: true },
  { to: '/dashboard/assigned', icon: FiClipboard, label: 'Assigned Complaints' },
  { to: '/dashboard/map', icon: FiMap, label: 'Ward Map' },
  { to: '/dashboard/performance', icon: FiBarChart2, label: 'Performance' },
  { to: '/dashboard/reports', icon: FiFileText, label: 'Reports' },
  { to: '/dashboard/notifications', icon: FiBell, label: 'Notifications' },
];

const corporationLinks = [
  { to: '/dashboard', icon: FiHome, label: 'Dashboard', end: true },
  { to: '/dashboard/complaints', icon: FiClipboard, label: 'All Complaints' },
  { to: '/dashboard/assign', icon: FiUsers, label: 'Assign Complaints' },
  { to: '/dashboard/analytics', icon: FiBarChart2, label: 'Analytics' },
  { to: '/dashboard/ward-performance', icon: FiAward, label: 'Ward Performance' },
  { to: '/dashboard/reports', icon: FiFileText, label: 'Reports' },
  { to: '/dashboard/notifications', icon: FiBell, label: 'Notifications' },
];

const adminLinks = [
  { to: '/dashboard', icon: FiHome, label: 'Dashboard', end: true },
  { to: '/dashboard/users', icon: FiUsers, label: 'User Management' },
  { to: '/dashboard/wards', icon: FiGrid, label: 'Ward Management' },
  { to: '/dashboard/officials', icon: FiShield, label: 'Officer Management' },
  { to: '/dashboard/complaints', icon: FiClipboard, label: 'Complaint Monitoring' },
  { to: '/dashboard/blockchain', icon: FiActivity, label: 'Blockchain' },
  { to: '/dashboard/analytics', icon: FiBarChart2, label: 'AI Analytics' },
  { to: '/dashboard/reports', icon: FiFileText, label: 'Reports' },
  { to: '/dashboard/settings', icon: FiSettings, label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const getLinks = () => {
    switch (user?.role) {
      case 'citizen': return citizenLinks;
      case 'ward_member': return wardLinks;
      case 'corporation_official': return corporationLinks;
      case 'admin': return adminLinks;
      default: return citizenLinks;
    }
  };

  const links = getLinks();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-y-auto
      `}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
              MC
            </div>
            <div>
              <h2 className="font-semibold text-sm">Madurai Smart City</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Civic Platform</p>
            </div>
          </div>
        </div>

        <div className="p-3 pb-20">
          <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 font-semibold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to + (link.end || '')}
                to={link.to}
                end={link.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
