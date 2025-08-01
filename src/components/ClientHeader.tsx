import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Calendar, 
  Package, 
  User,
  Bell,
  Settings,
  LogOut,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const ClientHeader = () => {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  // CLIENT-ONLY navigation items - NO admin features
  const clientNavItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: Home, 
      path: "/client/dashboard"
    },
    { 
      id: "sessions", 
      label: "My Sessions", 
      icon: Calendar, 
      path: "/client/sessions"
    },
    { 
      id: "packages", 
      label: "My Packages", 
      icon: Package, 
      path: "/client/packages"
    },
    { 
      id: "profile", 
      label: "My Profile", 
      icon: User, 
      path: "/client/profile"
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-header shadow-elevated border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/client/dashboard" className="flex items-center">
              <div className="bg-gradient-to-r from-primary to-primary-light w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">PT</span>
              </div>
              <span className="text-header-foreground font-bold text-xl">TrainWithUs</span>
            </Link>
          </div>

          {/* CLIENT NAVIGATION - Only appropriate items */}
          <nav className="hidden md:flex space-x-1">
            {clientNavItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                asChild
                className={`text-header-foreground hover:bg-white/10 hover:text-white ${
                  isActive(item.path) ? 'bg-white/10 text-white' : ''
                }`}
              >
                <Link to={item.path}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-header-foreground hover:bg-white/10 hover:text-white">
              <Bell className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-header-foreground hover:bg-white/10 hover:text-white h-8 px-2">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                    <AvatarFallback className="text-xs">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block font-medium">
                    {profile?.first_name} {profile?.last_name}
                  </span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-popover border-border shadow-elevated" align="end">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium">{profile?.first_name} {profile?.last_name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">Client</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link to="/client/profile">
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/client/profile">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive cursor-pointer"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ClientHeader;