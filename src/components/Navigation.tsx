import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/add-sale", label: "Add Sale", icon: "➕" },
    { path: "/customers", label: "Customers", icon: "👥" },
    { path: "/analytics", label: "Analytics", icon: "📈" }
  ];

  return (
    <Card className="p-4 mb-6 bg-card">
      <nav className="flex flex-wrap gap-2 sm:gap-4 justify-center">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              location.pathname === item.path
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            )}
          >
            <span className="text-base">{item.icon}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        ))}
      </nav>
    </Card>
  );
};

export default Navigation;