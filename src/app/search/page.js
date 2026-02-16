'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import apiClient from '@/utils/apiClient';
import Link from 'next/link';
import Loader from '@/components/Loader';
import styles from './page.module.css';

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get('query');
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (query) {
            fetchResults();
        } else {
            setLoading(false);
        }
    }, [query]);

    const fetchResults = async () => {
        setLoading(true);
        try {
            const res = await apiClient(`/api/v1/videos/search?query=${encodeURIComponent(query)}&limit=50`);
            const data = await res.json();
            if (res.ok) {
                setVideos(data.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Helper for formatting duration
    const formatDuration = (seconds) => {
        if (!seconds) return '00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>
                Search results for: <span className={styles.query}>"{query}"</span>
            </h1>

            {loading ? (
                <div className={styles.loading}>
                    <Loader size="lg" />
                </div>
            ) : videos.length === 0 ? (
                <div className={styles.noResults}>
                    No videos found matching your query.
                </div>
            ) : (
                <div className={styles.grid}>
                    {videos.map(video => (
                        <Link href={`/watch/${video._id || video.id}`} key={video._id || video.id} className={styles.card}>
                            <div className={styles.thumbnailWrapper}>
                                <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className={styles.thumbnail}
                                />
                                <span className={styles.duration}>
                                    {formatDuration(video.duration)}
                                </span>
                            </div>
                            <div className={styles.info}>
                                <div className={styles.avatarWrapper}>
                                    {video.owner?.avatar ? (
                                        <img src={video.owner.avatar} alt="avatar" className={styles.avatar} />
                                    ) : (
                                        <div className={styles.avatarPlaceholder}>
                                            {video.owner?.username?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.textContent}>
                                    <h3 className={styles.videoTitle}>{video.title}</h3>
                                    <div className={styles.metadata}>
                                        <span>{video.owner?.username}</span>
                                        <span>•</span>
                                        <span>{video.views} views</span>
                                        <span>•</span>
                                        <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className={styles.description}>
                                        {video.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<Loader size="lg" />}>
            <SearchResults />
        </Suspense>
    );
}
