'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import styles from './Sidebar.module.css';
import apiClient from '@/utils/apiClient';

export default function Sidebar() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    if (user) {
      fetchSubscriptions();
    } else {
      setSubscriptions([]);
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      // Using /api/v1/subscriptions/c/:channelId endpoint which currently maps to getSubscribedChannels
      // and we patched the controller to treat channelId as subscriberId
      const res = await apiClient(`/api/v1/subscriptions/c/${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        console.log("subscribers : ", data);

        setSubscriptions(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch subs", error);
    }
  };

  const mainLinks = [
    { name: 'Home', path: '/', icon: '🏠' },
    // { name: 'Shorts', path: '/shorts', icon: '⚡' }, // Future feature
    // { name: 'Subscriptions', path: '/feed/subscriptions', icon: '📺' }, // Future feature
  ];

  const userLinks = [
    { name: 'History', path: '/history', icon: '⏳' },
    { name: 'Liked videos', path: '/liked', icon: '👍' },
    { name: 'Your videos', path: '/dashboard', icon: '▶' },
  ];

  return (
    <aside className={styles.sidebar} style={{ width: isCollapsed ? '70px' : '240px', transition: 'width 0.3s ease' }}>
      <div className={styles.section}>
        {mainLinks.map((link) => (
          <Link
            key={link.name}
            href={link.path}
            className={`${styles.navItem} ${pathname === link.path ? styles.active : ""
              }`}
          >

            <span className={styles.icon}>{link.icon}</span>
            {!isCollapsed && link.name}
          </Link>
        ))}
      </div>

      <div className={styles.section}>
        {!isCollapsed && <h3 className={styles.sectionTitle}>You</h3>}
        {userLinks.map((link) => (
          <Link
            key={link.name}
            href={link.path}
            className={`${styles.navItem} ${pathname === link.path ? styles.active : ""
              }`}
          >

            <span className={styles.icon}>{link.icon}</span>
            {!isCollapsed && link.name}
          </Link>
        ))}
      </div>

      {user && (
        <div className={styles.section}>
          {!isCollapsed && <h3 className={styles.sectionTitle}>Subscriptions</h3>}
          {subscriptions.map((sub) => (
            <Link
              key={sub.channel?.id}
              href={`/c/${sub.channel?.userName}`}
              className={styles.channelItem}
            >
              <img
                src={sub.channel?.avatar || "https://via.placeholder.com/24"}
                alt={sub.channel?.userName}
                className={styles.channelAvatar}
              />
              {!isCollapsed && <span>{sub.channel?.userName || sub.channel?.fullName}</span>}
            </Link>
          ))}
          {subscriptions.length === 0 && (
            <div
              style={{ padding: "0 12px", fontSize: "13px", color: "#aaa" }}
            >
              No subscriptions yet
            </div>
          )}
        </div>
      )}

      <div className={styles.section}>
        <Link href="/settings" className={styles.navItem}>
          <span className={styles.icon}>⚙️</span>
          {!isCollapsed && "Settings"}
        </Link>
      </div>
    </aside>
  );
}
