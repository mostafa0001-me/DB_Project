import { Link } from 'wouter';
import { MenuIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <button 
            className="md:hidden text-gray-500 focus:outline-none" 
            onClick={onMenuClick}
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <h2 className="ml-4 text-lg font-medium">{title}</h2>
        </div>
        <div className="flex items-center">
          <div className="relative mr-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-full md:w-64"
            />
          </div>
          {!user && (
            <div className="hidden md:block space-x-2">
              <Link href="/auth">
                <Button variant="default" size="sm">Login</Button>
              </Link>
              <Link href="/auth?register=true">
                <Button variant="secondary" size="sm">Register</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
