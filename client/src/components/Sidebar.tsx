import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import {
  HomeIcon,
  Award,
  PlusCircle,
  Film,
  Trophy,
  Globe,
  Flag,
  Stars,
  Building2,
  Languages,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({ className = '', onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <HomeIcon className="w-5 h-5" /> },
    { path: '/nominations', label: 'My Nominations', icon: <Award className="w-5 h-5" /> },
    { path: '/add-nomination', label: 'Add Nomination', icon: <PlusCircle className="w-5 h-5" /> },
    { path: '/top-movies', label: 'Top Nominated Movies', icon: <Film className="w-5 h-5" /> },
    { path: '/staff-oscars', label: 'Staff Oscar Stats', icon: <Trophy className="w-5 h-5" /> },
    { path: '/birth-countries', label: 'Birth Countries', icon: <Globe className="w-5 h-5" /> },
    { path: '/staff-by-country', label: 'Staff by Country', icon: <Flag className="w-5 h-5" /> },
    { path: '/dream-team', label: 'Dream Team', icon: <Stars className="w-5 h-5" /> },
    { path: '/production-companies', label: 'Top Production Companies', icon: <Building2 className="w-5 h-5" /> },
    { path: '/non-english-movies', label: 'Non-English Winners', icon: <Languages className="w-5 h-5" /> }
  ];

  const getUserName = () => {
    if (!user) return '';
    // Check for lowercase username property (from our schema)
    // Then fallback to checking for Username property (from database)
    return user.username || (user as any).Username || '';
  };

  const getInitials = () => {
    const username = getUserName();
    if (!username) return "?";
    return username.slice(0, 2).toUpperCase();
  };

  // Group menu items for better organization
  const dashboardItems = menuItems.slice(0, 3);
  const statisticsItems = menuItems.slice(3);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between h-16 border-b border-gray-200 px-4">
        <h1 className="text-xl font-bold text-primary">Oscar Nominations DB</h1>
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden text-gray-500 hover:text-gray-700"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="mt-2">
          <div className="px-4 mb-1 text-gray-500 text-xs font-medium uppercase tracking-wider">
            Main
          </div>
          
          {dashboardItems.map((item) => {
            const isActive = location === item.path;
            
            return (
              <Link 
                key={item.path}
                href={item.path}
                onClick={onClose}
              >
                <div 
                  className={`
                    px-4 py-2 mx-2 mb-1 cursor-pointer flex items-center rounded-md transition-colors
                    ${isActive 
                      ? 'text-primary-800 bg-primary-100 bg-opacity-80' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {item.icon}
                  <span className="ml-3 text-sm">{item.label}</span>
                </div>
              </Link>
            );
          })}
          
          <div className="px-4 mt-6 mb-1 text-gray-500 text-xs font-medium uppercase tracking-wider">
            Statistics
          </div>
          
          {statisticsItems.map((item) => {
            const isActive = location === item.path;
            
            return (
              <Link 
                key={item.path}
                href={item.path}
                onClick={onClose}
              >
                <div 
                  className={`
                    px-4 py-2 mx-2 mb-1 cursor-pointer flex items-center rounded-md transition-colors
                    ${isActive 
                      ? 'text-primary-800 bg-primary-100 bg-opacity-80' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {item.icon}
                  <span className="ml-3 text-sm">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {user && (
        <div className="bg-gray-100 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="text-sm">{getInitials()}</span>
            </div>
            <span className="ml-2 text-sm font-medium">{getUserName()}</span>
            <button 
              className="ml-auto text-gray-400 hover:text-gray-600"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}