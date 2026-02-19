import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, FolderOpen, Truck, ShoppingCart,
  TrendingUp, BarChart3, Users, Settings, AlertTriangle, BoxIcon, X,
} from "lucide-react";

const navigation = [
  { name: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { name: "Produits", href: "/produits", icon: Package },
  { name: "Catégories", href: "/categories", icon: FolderOpen },
  { name: "Fournisseurs", href: "/fournisseurs", icon: Truck },
  { name: "Achats", href: "/achats", icon: ShoppingCart },
  { name: "Ventes", href: "/ventes", icon: TrendingUp },
  { name: "Stock", href: "/stock", icon: BoxIcon },
  { name: "Rapports", href: "/rapports", icon: BarChart3 },
  { name: "Utilisateurs", href: "/utilisateurs", icon: Users },
  { name: "Paramètres", href: "/parametres", icon: Settings },
];

interface AppSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const AppSidebar = ({ open, onClose }: AppSidebarProps) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Package className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-accent-foreground">StockMaster</h1>
              <p className="text-[10px] font-medium text-sidebar-muted tracking-wider uppercase">Pro</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-foreground hover:text-sidebar-accent-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`sidebar-link ${isActive ? "sidebar-link-active" : "sidebar-link-inactive"}`}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" style={{ width: 18, height: 18 }} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Alert section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <div>
              <p className="text-xs font-medium text-sidebar-accent-foreground">3 alertes stock</p>
              <p className="text-[10px] text-sidebar-muted">Seuil critique atteint</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
