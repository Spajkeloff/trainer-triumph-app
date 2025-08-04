import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Calendar, 
  Users, 
  Grid3X3, 
  DollarSign, 
  BarChart3, 
  ChevronDown,
  Bell,
  Settings,
  User,
  LogOut
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

const Header = () => {
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { user, profile, signOut } = useAuth();

  // ADMIN/TRAINER ONLY navigation - Security fix
  const getNavItems = () => {
    const userRole = profile?.role;
    
    if (userRole === 'admin') {
      return [
        { 
          id: "dashboard", 
          label: "Dashboard", 
          icon: Home, 
          path: "/admin/dashboard",
          dropdown: null
        },
        { 
          id: "calendar", 
          label: "Calendar", 
          icon: Calendar, 
          path: "/admin/calendar",
          dropdown: null
        },
        { 
          id: "clients", 
          label: "Clients", 
          icon: Users, 
          path: "/admin/clients",
          dropdown: [
            { label: "All Clients", path: "/admin/clients" },
            { label: "Active Clients", path: "/admin/clients/active" },
            { label: "Leads", path: "/admin/clients/leads" },
            { label: "Add Client", path: "/admin/clients/new" },
          ]
        },
        { 
          id: "services", 
          label: "Services", 
          icon: Grid3X3, 
          path: "/admin/services",
          dropdown: [
            { label: "Training Packages", path: "/admin/services" },
          ]
        },
        { 
          id: "finances", 
          label: "Finances", 
          icon: DollarSign, 
          path: "/admin/finances",
          dropdown: [
            { label: "Payments & Transactions", path: "/admin/finances/payments" },
          ]
        },
        { 
          id: "reporting", 
          label: "Reporting", 
          icon: BarChart3, 
          path: "/admin/reporting",
          dropdown: [
            { label: "Business Report", path: "/admin/reporting" },
          ]
        },
      ];
    } else if (userRole === 'trainer') {
      return [
        { 
          id: "dashboard", 
          label: "Dashboard", 
          icon: Home, 
          path: "/trainer/dashboard",
          dropdown: null
        },
        { 
          id: "calendar", 
          label: "Calendar", 
          icon: Calendar, 
          path: "/trainer/calendar",
          dropdown: null
        },
        { 
          id: "clients", 
          label: "My Clients", 
          icon: Users, 
          path: "/trainer/clients",
          dropdown: null
        },
      ];
    }
    
    // Security fallback - if somehow non-admin/trainer gets here, show nothing
    return [];
  };

  const navItems = getNavItems();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-header shadow-elevated border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <div className="bg-gradient-to-r from-primary to-primary-light w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">PT</span>
              </div>
              <span className="text-header-foreground font-bold text-xl">TrainWithUs</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <div key={item.id} className="relative">
                {item.dropdown ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`text-header-foreground hover:bg-white/10 hover:text-white ${
                          isActive(item.path) ? 'bg-white/10 text-white' : ''
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 bg-popover border-border shadow-elevated">
                      {item.dropdown.map((dropdownItem, index) => (
                        <DropdownMenuItem key={index} asChild>
                          <Link
                            to={dropdownItem.path}
                            className="flex items-center px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            {dropdownItem.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
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
                )}
              </div>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
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
                  <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
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

export default Header;