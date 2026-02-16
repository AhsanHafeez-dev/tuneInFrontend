'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import apiClient from '@/utils/apiClient';
import Link from 'next/link';
import Loader from '@/components/Loader';

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
        <div style={{ padding: '2rem' }}>
            <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                Search results for: "<span style={{ color: 'var(--primary)' }}>{query}</span>"
            </h1>

            {loading ? (
                <Loader size="lg" />
            ) : videos.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '2rem', color: 'gray' }}>
                    No videos found matching your query.
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '2rem'
                }}>
                    {videos.map(video => (
                        <Link href={`/watch/${video._id || video.id}`} key={video._id || video.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
                                    <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        bottom: '8px',
                                        right: '8px',
                                        background: 'rgba(0,0,0,0.8)',
                                        padding: '2px 4px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        fontWeight: '500'
                                    }}>
                                        {formatDuration(video.duration)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#333', overflow: 'hidden', flexShrink: 0 }}>
                                        {video.owner?.avatar ? (
                                            <img src={video.owner.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                                {video.owner?.username?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '600', lineHeight: '1.4', marginBottom: '4px' }}>{video.title}</h3>
                                        <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
                                            <span>{video.owner?.username}</span>
                                            <span style={{ margin: '0 4px' }}>•</span>
                                            <span>{video.views} views</span>
                                            <span style={{ margin: '0 4px' }}>•</span>
                                            <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {video.description}
                                        </p>
                                    </div>
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
