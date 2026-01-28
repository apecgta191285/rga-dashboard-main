// frontend/src/components/layout/AppSidebar.tsx
// =============================================================================
// Application Sidebar - Uses Shadcn Sidebar Components
// Features: Sub-route highlighting, mobile Sheet drawer, keyboard shortcuts
// =============================================================================

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore, selectUser } from '@/stores/auth-store';
import { UserRole } from '@/types/enums';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    BarChart3,
    ChevronDown,
    Database,
    FileText,
    LineChart,
    LogOut,
    Search,
    Settings,
    TrendingUp,
    Users,
    Zap,
    Filter,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// =============================================================================
// Types & Menu Configuration
// =============================================================================

interface NavSubItem {
    label: string;
    href: string;
    icon?: LucideIcon;
}

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    comingSoon?: boolean;
    adminOnly?: boolean;
    subItems?: NavSubItem[];
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        title: 'Analytics',
        items: [
            {
                label: 'Overview',
                href: '/dashboard',
                icon: BarChart3,
                subItems: [
                    { label: 'Integration Checklist', href: '/dashboard#integration-checklist', icon: Zap },
                    { label: 'Performance Trends', href: '/dashboard#performance-trends', icon: LineChart },
                    { label: 'Conversion Funnel', href: '/dashboard#conversion-funnel', icon: Filter },
                ],
            },
            { label: 'Campaigns', href: '/campaigns', icon: Zap },
            { label: 'Data Sources', href: '/data-sources', icon: Database },
        ],
    },
    {
        title: 'Intelligence',
        items: [
            { label: 'AI Insights', href: '/ai-insights', icon: Zap, comingSoon: true },
            { label: 'Trend Analysis', href: '/trend-analysis', icon: TrendingUp, comingSoon: true },
            { label: 'SEO & Web', href: '/seo-web-analytics', icon: Search, comingSoon: true },
        ],
    },
    {
        title: 'System',
        items: [
            { label: 'Settings', href: '/settings', icon: Settings },
            { label: 'Reports', href: '/reports', icon: FileText },
        ],
    },
];

// =============================================================================
// Component
// =============================================================================

export function AppSidebar() {
    const [location, setLocation] = useLocation();
    const user = useAuthStore(selectUser);
    const logout = useAuthStore((state) => state.logout);

    // ✅ FIX: Sub-route matching (e.g., /campaigns/abc123 highlights /campaigns)
    const isActive = (url: string) =>
        location === url || location.startsWith(`${url}/`);

    const handleLogout = () => {
        logout();
        setLocation('/login');
    };

    // Add admin-only items dynamically
    const getNavGroups = (): NavGroup[] => {
        return NAV_GROUPS.map((group) => {
            if (group.title === 'System' && user?.role === UserRole.ADMIN) {
                return {
                    ...group,
                    items: [
                        ...group.items,
                        { label: 'Users', href: '/users', icon: Users, adminOnly: true },
                    ],
                };
            }
            return group;
        });
    };

    return (
        <Sidebar>
            {/* Header / Logo */}
            <SidebarHeader className="border-b border-sidebar-border p-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                        R
                    </div>
                    <span className="font-bold text-xl text-sidebar-foreground tracking-tight">
                        RGA<span className="text-indigo-600">.Data</span>
                    </span>
                </div>
            </SidebarHeader>

            {/* Navigation */}
            <SidebarContent>
                {getNavGroups().map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);

                                    if (item.comingSoon) {
                                        return (
                                            <SidebarMenuItem key={item.label}>
                                                <SidebarMenuButton
                                                    disabled
                                                    tooltip={`${item.label} (Coming Soon)`}
                                                >
                                                    <Icon className="size-4" />
                                                    <span>{item.label}</span>
                                                    <span className="ml-auto text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                                        Soon
                                                    </span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    }

                                    // Items with sub-menu (collapsible)
                                    if (item.subItems && item.subItems.length > 0) {
                                        return (
                                            <Collapsible
                                                key={item.href}
                                                defaultOpen={active}
                                                className="group/collapsible"
                                            >
                                                <SidebarMenuItem>
                                                    <CollapsibleTrigger asChild>
                                                        <SidebarMenuButton
                                                            isActive={active}
                                                            tooltip={item.label}
                                                        >
                                                            <Icon className="size-4" />
                                                            <span>{item.label}</span>
                                                            <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                                        </SidebarMenuButton>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <SidebarMenuSub>
                                                            {item.subItems.map((subItem) => {
                                                                const SubIcon = subItem.icon;
                                                                const subActive = location.includes(subItem.href.split('#')[1] || '');
                                                                return (
                                                                    <SidebarMenuSubItem key={subItem.href}>
                                                                        <SidebarMenuSubButton
                                                                            isActive={subActive}
                                                                            onClick={() => {
                                                                                setLocation(subItem.href.split('#')[0]);
                                                                                // Scroll to section after navigation
                                                                                setTimeout(() => {
                                                                                    const hash = subItem.href.split('#')[1];
                                                                                    if (hash) {
                                                                                        const element = document.getElementById(hash);
                                                                                        element?.scrollIntoView({ behavior: 'smooth' });
                                                                                    }
                                                                                }, 100);
                                                                            }}
                                                                        >
                                                                            {SubIcon && <SubIcon className="size-4" />}
                                                                            <span>{subItem.label}</span>
                                                                        </SidebarMenuSubButton>
                                                                    </SidebarMenuSubItem>
                                                                );
                                                            })}
                                                        </SidebarMenuSub>
                                                    </CollapsibleContent>
                                                </SidebarMenuItem>
                                            </Collapsible>
                                        );
                                    }

                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                isActive={active}
                                                tooltip={item.label}
                                                onClick={() => setLocation(item.href)}
                                            >
                                                <Icon className="size-4" />
                                                <span>{item.label}</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            {/* Footer / User Info */}
            <SidebarFooter className="border-t border-sidebar-border">
                <SidebarMenu>
                    {/* User Info */}
                    <SidebarMenuItem>
                        <div className="flex items-center gap-3 px-2 py-2">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-sidebar-foreground truncate">
                                    {user?.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                    </SidebarMenuItem>

                    <SidebarSeparator />

                    {/* Logout */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleLogout}
                            tooltip="Sign Out"
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <LogOut className="size-4" />
                            <span>Sign Out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
