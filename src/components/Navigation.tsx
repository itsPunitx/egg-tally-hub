import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Plus, Users, BarChart3, Package } from "lucide-react";
import ProfileDropdown from "@/components/ProfileDropdown";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/add-sale", label: "Add Sale", icon: Plus },
    { path: "/customers", label: "Customers", icon: Users },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <nav className="bg-card border-b border-border mb-6 shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-primary">Dashboard</h1>
          </div>
          
          <div className="hidden md:flex space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  asChild
                >
                  <Link to={item.path} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
            <ProfileDropdown />
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <div className="flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant={location.pathname === item.path ? "default" : "ghost"}
                    size="sm"
                    asChild
                  >
                    <Link to={item.path}>
                      <Icon className="h-4 w-4" />
                    </Link>
                  </Button>
                );
              })}
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;