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
  { 
    label: "ORDERS", 
    path: "/seller/orders", 
    requiresPayment: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )
  },
  { 
    label: "GROWTH", 
    path: "/seller/growth", 
    requiresPayment: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  },
  {
    label: "MENU",
    path: "/seller/menu",
    hasSubmenu: true,
    requiresPayment: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    submenuItems: [
      {
        label: "Category",
        path: "/seller/category",
        requiresPayment: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
        ),
      },
      {
        label: "Products",
        path: "/seller/product/list",
        requiresPayment: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        ),
      },
   {
    label:"Add Product",
    path:"/seller/product/add",
    requiresPayment: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
    ),
   },
      {
        label: "Stock Manage",
        path: "/seller/product/stock",
        requiresPayment: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
        ),
      },
      {
        label: "Taxes",
        path: "/seller/product/taxes",
        requiresPayment: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="18" rx="4" ry="2"></ellipse><ellipse cx="12" cy="14" rx="3.5" ry="1.8"></ellipse><ellipse cx="12" cy="10" rx="3" ry="1.5"></ellipse><circle cx="9" cy="9" r="1" fill="currentColor"></circle></svg>
        ),
      },
    ],
  },
  { 
    label: "COMPLAINTS", 
    path: "/seller/complaints", 
    requiresPayment: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  },
  { 
    label: "RATINGS", 
    path: "/seller/ratings", 
    requiresPayment: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    )
  },
  { 
    label: "REPORTS", 
    path: "/seller/reports", 
    requiresPayment: true,
    hasSubmenu: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 01-2 2h22a2 2 0 01-2-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6" />
      </svg>
    ),
    submenuItems: [
      {
        label: "Sales Report",
        path: "/seller/reports/sales",
        requiresPayment: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
        ),
      },
      {
        label: "Analytics",
        path: "/seller/reports",
        requiresPayment: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 01-2 2h22a2 2 0 01-2-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6"></path></svg>
        ),
      }
    ]
  },
  { 
    label: "FINANCE", 
    path: "/seller/finance", 
    requiresPayment: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
      </svg>
    )
  },
  { 
    label: "HELP", 
    path: "/seller/help", 
    requiresPayment: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    )
  },
  { 
    label: "OUTLETS & STAFF", 
    path: "/seller/outlets", 
    requiresPayment: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  // {
  //   label: "Video Call",
  //   path: "/seller/call",
  //   icon: (
  //     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //       <path d="M23 7l-7 5 7 5V7z"></path>
  //       <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
  //     </svg>
  //   ),
  // },
  // {
  //   label: "Spin & Win",
  //   path: "/seller/spin-wheel",
  //   icon: (
  //     <svg
  //       width="18"
  //       height="18"
  //       viewBox="0 0 24 24"
  //       fill="none"
  //       stroke="currentColor"
  //       strokeWidth="2"
  //       strokeLinecap="round"
  //       strokeLinejoin="round">
  //       <circle cx="12" cy="12" r="9"></circle>
  //       <path d="M12 3v3"></path>
  //       <path d="M21 12h-3"></path>
  //       <path d="M12 21v-3"></path>
  //       <path d="M3 12h3"></path>
  //     </svg>
  //   ),
  // },
  {
    label: "Profile",
    path: "/seller/account-settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    ),
  },
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
