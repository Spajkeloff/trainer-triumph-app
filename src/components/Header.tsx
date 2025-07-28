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
  User
} from "lucide-react";
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

  const navItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: Home, 
      path: "/",
      dropdown: null
    },
    { 
      id: "calendar", 
      label: "Calendar", 
      icon: Calendar, 
      path: "/calendar",
      dropdown: null
    },
    { 
      id: "clients", 
      label: "Clients", 
      icon: Users, 
      path: "/clients",
      dropdown: [
        { label: "All Clients", path: "/clients" },
        { label: "Active Clients", path: "/clients/active" },
        { label: "Leads", path: "/clients/leads" },
        { label: "Add Client", path: "/clients/new" },
      ]
    },
    { 
      id: "services", 
      label: "Services", 
      icon: Grid3X3, 
      path: "/services",
      dropdown: [
        { label: "Packages", path: "/services/packages" },
        { label: "Memberships", path: "/services/memberships" },
        { label: "Products", path: "/services/products" },
        { label: "Session Templates", path: "/services/templates" },
        { label: "Class Templates", path: "/services/classes" },
        { label: "Discounts", path: "/services/discounts" },
      ]
    },
    { 
      id: "finances", 
      label: "Finances", 
      icon: DollarSign, 
      path: "/finances",
      dropdown: [
        { label: "Payments", path: "/finances/payments" },
        { label: "Invoices", path: "/finances/invoices" },
        { label: "Outstanding", path: "/finances/outstanding" },
        { label: "Expenses", path: "/finances/expenses" },
      ]
    },
    { 
      id: "reporting", 
      label: "Reporting", 
      icon: BarChart3, 
      path: "/reporting",
      dropdown: [
        { label: "Revenue Reports", path: "/reporting/revenue" },
        { label: "Client Reports", path: "/reporting/clients" },
        { label: "Session Reports", path: "/reporting/sessions" },
        { label: "Financial Reports", path: "/reporting/financial" },
      ]
    },
  ];

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
              <span className="text-header-foreground font-bold text-xl">PTminder</span>
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
            <Button variant="ghost" size="icon" className="text-header-foreground hover:bg-white/10 hover:text-white">
              <Bell className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-header-foreground hover:bg-white/10 hover:text-white">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-popover border-border shadow-elevated" align="end">
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Trainer name */}
            <div className="hidden md:block text-header-foreground text-sm">
              <span className="font-medium">Lazar Sretenovic</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;