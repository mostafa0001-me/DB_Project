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
  LogOut
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

  return (
    <div className={className}>
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary">Oscar Nominations DB</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto pt-2">
        <nav className="mt-4">
          {menuItems.map((item, index) => {
            const isActive = location === item.path;
            
            // Render divider for statistics section
            const showDivider = index === 3;
            
            return (
              <div key={item.path}>
                {showDivider && (
                  <div className="px-4 mt-2 text-gray-400 text-sm">STATISTICS</div>
                )}
                <Link 
                  href={item.path}
                  onClick={onClose}
                >
                  <div 
                    className={`
                      px-4 py-3 cursor-pointer flex items-center
                      ${isActive 
                        ? 'text-primary-800 bg-primary-100 bg-opacity-10 border-l-4 border-primary' 
                        : 'hover:bg-gray-100'
                      }
                    `}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </div>
                </Link>
              </div>
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
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
