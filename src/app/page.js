'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import apiClient from '@/utils/apiClient';

function HomeContent() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const url = query
          ? `/api/v1/videos?query=${encodeURIComponent(query)}&page=1&limit=50`
          : `/api/v1/videos?page=1&limit=50`;

        const res = await apiClient(url, {
          cache: "no-store",
          
        });
        if (res.ok) {
          const data = await res.json();
          setVideos(data?.data?.docs || data?.data || []);
        } else {
          setVideos([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [query]);

  if (loading) {
    return (
      <div className={styles.grid}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className={styles.card} style={{ height: 280, background: '#222' }}></div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {videos.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No videos found</h2>
          <p>Be the first to upload one!</p>
        </div>
      ) : (
        videos.map((video) => (
          <div key={video._id || video.id} className={styles.card}>
            <Link href={`/watch/${video._id || video.id}`} className={styles.thumbnailWrapper}>
              <img src={video.thumbnail} alt={video.title} className={styles.thumbnail} />
              <span className={styles.duration}>{Math.floor(video.duration)}s</span>
            </Link>
            <div className={styles.info}>
              <Link href={`/c/${video.owner.username}`} className={styles.avatar}>
                {video.owner.avatar ? (
                  <img src={video.owner.avatar} alt={video.owner.fullName} className={styles.avatarImage} />
                ) : (
                  <div className={styles.avatarPlaceholder}>{video.owner.fullName?.[0]?.toUpperCase()}</div>
                )}
              </Link>
              <div className={styles.details}>
                <h3 className={styles.title}>
                  <Link href={`/watch/${video._id || video.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {video.title}
                  </Link>
                </h3>
                <Link href={`/c/${video.owner.username}`} className={styles.channelName}>
                  {video.owner.fullName || video.owner.username}
                </Link>
                <div className={styles.meta}>
                  <span>{video.views} views</span>
                  <span>•</span>
                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

import { useAuth } from '@/context/AuthContext';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
      <HomeWrapper />
    </Suspense>
  );
}

function HomeWrapper() {
  const { user, loading } = useAuth();

  if (loading) return null; // or spinner

  if (!user) {
    return <LandingPage />;
  }

  return <HomeContent />;
}
