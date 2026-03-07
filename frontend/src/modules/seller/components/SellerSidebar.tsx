import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";

interface SubMenuItem {
  label: string;
  path: string;
  icon: JSX.Element;
  requiresPayment?: boolean;
}

interface MenuItem {
  label: string;
  path: string;
  hasSubmenu?: boolean;
  submenuItems?: SubMenuItem[];
  icon?: JSX.Element;
  requiresPayment?: boolean;
}

interface SellerSidebarProps {
  onClose?: () => void;
}

const menuItems: MenuItem[] = [
  { label: "Dashboard", path: "/seller" },
  { label: "Orders", path: "/seller/orders", requiresPayment: true },
  { label: "Category", path: "/seller/category", requiresPayment: true },
  { label: "SubCategory", path: "/seller/subcategory", requiresPayment: true },
  {
    label: "Product",
    path: "/seller/product",
    hasSubmenu: true,
    requiresPayment: true,
    submenuItems: [
      {
        label: "Add new Product",
        path: "/seller/product/add",
        requiresPayment: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line><line x1="16" y1="12" x2="8" y2="12"></line><line x1="12" y1="16" x2="12" y2="8"></line></svg>
        ),
      },
      {
        label: "Taxes",
        path: "/seller/product/taxes",
        requiresPayment: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="18" rx="4" ry="2"></ellipse><ellipse cx="12" cy="14" rx="3.5" ry="1.8"></ellipse><ellipse cx="12" cy="10" rx="3" ry="1.5"></ellipse><circle cx="9" cy="9" r="1" fill="currentColor"></circle><line x1="7" y1="7" x2="11" y2="11" strokeWidth="2"></line><circle cx="15" cy="11" r="1" fill="currentColor"></circle></svg>
        ),
      },
      {
        label: "Product List",
        path: "/seller/product/list",
        requiresPayment: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><polyline points="9 12 11 14 15 10"></polyline><polyline points="9 16 11 18 15 14"></polyline></svg>
        ),
      },
      {
        label: "Stock Management",
        path: "/seller/product/stock",
        requiresPayment: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        ),
      },
    ],
  },
  {
    label: "Wallet",
    path: "/seller/wallet",
  },
  {
    label: "Reports",
    path: "/seller/reports",
    hasSubmenu: true,
    requiresPayment: true,
    submenuItems: [
      {
        label: "Sales Report",
        path: "/seller/reports/sales",
        requiresPayment: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        ),
      },
    ],
  },
  { label: "Return", path: "/seller/return", requiresPayment: true },
];

export default function SellerSidebar({ onClose }: SellerSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const isPaid = user?.securityDepositStatus === 'Paid' || user?.depositPaid === true;

  const isActive = (path: string) => {
    if (path === "/seller") {
      return (
        location.pathname === "/seller" || location.pathname === "/seller/"
      );
    }
    return location.pathname.startsWith(path);
  };

  const isSubmenuActive = (submenuItems?: SubMenuItem[]) => {
    if (!submenuItems) return false;
    return submenuItems.some(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(item.path + "/")
    );
  };

  const handleNavigation = (path: string, requiresPayment?: boolean) => {
    if (requiresPayment && !isPaid) {
      showToast("Please pay the security deposit to access this section.", "info");
      return;
    }
    navigate(path);
    // Close sidebar on mobile after navigation
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  const toggleMenu = (path: string, requiresPayment?: boolean) => {
    if (requiresPayment && !isPaid) {
      showToast("Please pay the security deposit to access this section.", "info");
      return;
    }
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const isExpanded = (path: string) => {
    return (
      expandedMenus.has(path) ||
      isSubmenuActive(
        menuItems.find((item) => item.path === path)?.submenuItems
      )
    );
  };

  const LockIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 opacity-60">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );

  return (
    <aside className="w-64 bg-teal-700 h-screen flex flex-col">
      {/* Close button - only show on mobile */}
      <div className="flex justify-end p-4 border-b border-teal-600 lg:hidden text-white">
        <button onClick={onClose} className="p-2 hover:bg-teal-600 rounded-lg">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <nav className="flex-1 py-4 sm:py-6 overflow-y-auto">
        <ul className="space-y-1 px-2 sm:px-4">
          {menuItems.map((item) => {
            const expanded = isExpanded(item.path);
            const active = isActive(item.path) || isSubmenuActive(item.submenuItems);
            const isLocked = item.requiresPayment && !isPaid;

            return (
              <li key={item.path}>
                <button
                  onClick={() => {
                    if (item.hasSubmenu && item.submenuItems) {
                      toggleMenu(item.path, item.requiresPayment);
                    } else {
                      handleNavigation(item.path, item.requiresPayment);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left transition-colors ${active ? "bg-teal-600 text-white" : "text-teal-100 hover:bg-teal-600/50 hover:text-white"
                    } ${isLocked ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                    <span className="text-xs sm:text-sm font-medium flex items-center">
                      {item.label}
                      {isLocked && <LockIcon />}
                    </span>
                  </div>
                  {item.hasSubmenu && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`transition-transform ${expanded ? "rotate-180" : ""} ${active ? "text-white" : "text-teal-200"}`}
                    >
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                {item.hasSubmenu && item.submenuItems && expanded && !isLocked && (
                  <ul className="mt-1 space-y-1 ml-4">
                    {item.submenuItems.map((subItem) => {
                      const subActive = location.pathname === subItem.path || location.pathname.startsWith(subItem.path + "/");
                      const subLocked = subItem.requiresPayment && !isPaid;
                      return (
                        <li key={subItem.path}>
                          <button
                            onClick={() => handleNavigation(subItem.path, subItem.requiresPayment)}
                            className={`w-full flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-left transition-colors ${subActive ? "bg-teal-500 text-white" : "text-teal-100 hover:bg-teal-600/50 hover:text-white"
                              } ${subLocked ? "opacity-70 cursor-not-allowed" : ""}`}
                          >
                            <span className="flex-shrink-0">{subItem.icon}</span>
                            <span className="text-xs sm:text-sm font-medium flex items-center">
                              {subItem.label}
                              {subLocked && <LockIcon />}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
