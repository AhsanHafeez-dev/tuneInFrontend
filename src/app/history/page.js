'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import apiClient from '@/utils/apiClient';

export default function HistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            fetchHistory();
        }
    }, [user, authLoading]);

    const fetchHistory = async () => {
        try {
            const res = await apiClient('/api/v1/users/history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data.data || []);
                data.data?.map((v) => console.log(v))
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || authLoading) {
        return <div className={styles.loading}>Loading history...</div>;
    }

    if (!user) return null; // Will redirect

    return (
        <div className={styles.container}>
            <h1 className={styles.heading}>Watch History</h1>

            {history.length === 0 ? (
                <div className={styles.empty}>
                    <p>You haven't watched any videos yet.</p>
                    <Link href="/" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                        Explore Videos
                    </Link>
                </div>
            ) : (
                <div className={styles.list}>
                    {history.map((video) => (
                        <div key={video.id} className={styles.card}>
                            <Link href={`/watch/${video.id}`} className={styles.thumbnailWrapper}>
                                <img src={video.thumbnail} alt={video.title} className={styles.thumbnail} />
                                <span className={styles.duration}>{Math.floor(video.duration)}s</span>
                            </Link>
                            <div className={styles.info}>
                                <Link href={`/watch/${video.id}`} className={styles.title}>
                                    {video.title}
                                </Link>
                                <div className={styles.meta}>
                                    <span>{video.views} views</span>
                                    <span>•</span>
                                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                                </div>
                                <Link href={`/c/${video.owner?.username}`} className={styles.channel}>
                                    {video.owner?.avatar ? (
                                        <img src={video.owner.avatar} alt={video.owner.username} className={styles.avatar} />
                                    ) : (
                                        <div className={styles.avatar} style={{ background: 'var(--primary)' }}></div>
                                    )}
                                    <span>{video.owner?.fullName || video.owner?.username}</span>
                                </Link>
                                <p className={styles.description}>{video.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
