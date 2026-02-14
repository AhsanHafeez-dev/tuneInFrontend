'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Sidebar.module.css';
import apiClient from '@/utils/apiClient';

export default function Sidebar() {
    const { user } = useAuth();
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
            const res = await apiClient(`/api/v1/subscriptions/c/${user._id}`);
            if (res.ok) {
                const data = await res.json();
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
        <aside className={styles.sidebar}>
            <div className={styles.section}>
                {mainLinks.map(link => (
                    <Link
                        key={link.name}
                        href={link.path}
                        className={`${styles.navItem} ${pathname === link.path ? styles.active : ''}`}
                    >
                        <span className={styles.icon}>{link.icon}</span>
                        {link.name}
                    </Link>
                ))}
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>You</h3>
                {userLinks.map(link => (
                    <Link
                        key={link.name}
                        href={link.path}
                        className={`${styles.navItem} ${pathname === link.path ? styles.active : ''}`}
                    >
                        <span className={styles.icon}>{link.icon}</span>
                        {link.name}
                    </Link>
                ))}
            </div>

            {user && (
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Subscriptions</h3>
                    {subscriptions.map(sub => (
                        <Link
                            key={sub.channel._id}
                            href={`/c/${sub.channel.username}`}
                            className={styles.channelItem}
                        >
                            <img
                                src={sub.channel.avatar || 'https://via.placeholder.com/24'}
                                alt={sub.channel.username}
                                className={styles.channelAvatar}
                            />
                            <span>{sub.channel.fullName || sub.channel.username}</span>
                        </Link>
                    ))}
                    {subscriptions.length === 0 && (
                        <div style={{ padding: '0 12px', fontSize: '13px', color: '#aaa' }}>
                            No subscriptions yet
                        </div>
                    )}
                </div>
            )}

            <div className={styles.section}>
                <Link href="/settings" className={styles.navItem}>
                    <span className={styles.icon}>⚙️</span>
                    Settings
                </Link>
            </div>
        </aside>
    );
}
