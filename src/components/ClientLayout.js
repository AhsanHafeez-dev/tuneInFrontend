'use client';
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import { useSidebar } from "@/context/SidebarContext";

export default function ClientLayout({ children }) {
    const { user, loading } = useAuth();
    const { isCollapsed } = useSidebar();

    // While loading auth state, maybe show essential layout or nothing specific?
    // We'll just default to no sidebar to avoid flickering.

    if (!user) {
        // Guest layout: Full width, no sidebar
        return (
            <main style={{ width: '100%' }}>
                {children}
            </main>
        );
    }

    // Authenticated layout: Sidebar + Content
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main style={{
                flex: 1,
                marginLeft: isCollapsed ? '70px' : '240px',
                width: isCollapsed ? 'calc(100% - 70px)' : 'calc(100% - 240px)',
                background: 'transparent',
                paddingTop: '80px', // Offset for fixed navbar
                transition: 'all 0.3s ease'
            }}>
                {children}
            </main>
        </div>
    );
}
