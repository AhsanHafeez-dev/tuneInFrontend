'use client';
import { usePathname } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import { useSidebar } from "@/context/SidebarContext";

export default function ClientLayout({ children }) {
    const { user, loading } = useAuth();
    const { isCollapsed } = useSidebar();
    const pathname = usePathname();

    // While loading auth state, maybe show essential layout or nothing specific?
    // We'll just default to no sidebar to avoid flickering.

    // Hide sidebar on login/register even if logged in
    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (!user || isAuthPage) {
        // Guest layout or Auth page: Full width, no sidebar
        return (
            <main style={{ width: '100%' }}>
                {children}
            </main>
        );
    }

    // Authenticated layout: Sidebar + Content
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{
                flex: 1,
                marginLeft: isCollapsed ? '80px' : '250px', // Match Sidebar width
                width: isCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
                background: 'transparent',
                paddingTop: '90px', // Increased offset for header
                paddingLeft: '2rem', // Added breathing room
                paddingRight: '2rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                {children}
            </main>
        </div>
    );
}
