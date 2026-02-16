'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import apiClient from '@/utils/apiClient';

import Loader from '@/components/Loader';

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth(); // rename loading to avoid conflict if needed, or just useAuth loading
    const [stats, setStats] = useState({});
    const [videos, setVideos] = useState([]);
    const [showUpload, setShowUpload] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // ... (rest of state)

    useEffect(() => {
        if (!user) return; // Wait for user
        const fetchDashboardData = async () => {
            setLoadingData(true);
            try {
                const statsRes = await apiClient('/api/v1/dashboard/stats');
                const videosRes = await apiClient('/api/v1/dashboard/videos');

                if (statsRes.ok) setStats((await statsRes.json()).data);
                if (videosRes.ok) setVideos((await videosRes.json()).data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingData(false);
            }
        };
        fetchDashboardData();
    }, [user]);

    // ... (rest of handlers)

    if (authLoading || (user && loadingData)) return <Loader size="lg" />;
    if (!user) return <div className="loading">Please login to view dashboard</div>;

    return (
        <div className={styles.container}>
            {/* ... header ... */}

            {/* Use overlay loader for uploading actions if desired, or keep button disabled state. 
                 User asked for "loading" to have loader. The initial load is covered above. 
                 Let's check if there are other loading states. 
                 Inside Upload Modal, if uploading, maybe show loader? 
                 Currently buttons say "Uploading...". I'll keep that for buttons as it's standard.
                 But the main page load should definitely use Loader.
             */}
            <div className={styles.header}>
                <h1>Channel Dashboard</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => setShowCoverModal(true)}>Update Cover</button>
                    <button className="btn btn-secondary" onClick={openPlaylistManager}>Create Playlist</button>
                    <button className="btn btn-primary" onClick={() => setShowUpload(true)}>+ Upload Video</button>
                </div>
            </div>

            <div className={styles.statsGrid}>
                {/* ... stats ... */}
                <div className={styles.statCard}>
                    <h3>Total Views</h3>
                    <p>{stats.totalViews || 0}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Subscribers</h3>
                    <p>{stats.subscribers || 0}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Total Videos</h3>
                    <p>{stats.totalVideos || 0}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Total Likes</h3>
                    <p>{stats.totalLikes || 0}</p>
                </div>
            </div>

            <h2 className={styles.sectionTitle}>Your Videos</h2>
            <div className={styles.videoList}>
                {videos.length === 0 ? (
                    <p style={{ color: 'gray' }}>No videos uploaded yet.</p>
                ) : (
                    videos.map(video => (
                        /* ... video item ... */
                        <div key={video.id} className={styles.videoItem}>
                            {/* ... content ... */}
                            <img src={video.thumbnail} alt={video.title} className={styles.videoThumb} />
                            {/* ... */}
                            <div className={styles.videoInfo}>
                                <h4>{video.title}</h4>
                                <div className={styles.metaRow}>
                                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                                    <span className={`${styles.status} ${video.isPublished ? styles.published : styles.private}`}>
                                        {video.isPublished ? 'Public' : 'Private'}
                                    </span>
                                </div>
                                <div className={styles.videoActions}>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleTogglePublish(video.id)}
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                    >
                                        {video.isPublished ? 'Unpublish' : 'Publish'}
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => openAddToPlaylist(video.id)}
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                    >
                                        Add to Playlist
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => handleDeleteVideo(video.id)}
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: 'hsl(0, 84%, 60%)', color: 'white', border: 'none' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showUpload && (
                <div className={styles.modalOverlay}>
                    {/* ... Upload Modal ... */}
                    <div className={styles.modal}>
                        {uploading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <Loader size="md" />
                                <p style={{ marginTop: '1rem' }}>Uploading video...</p>
                            </div>
                        ) : (
                            <>
                                <h2>Upload new video</h2>
                                <form onSubmit={handleUpload} className={styles.uploadForm}>
                                    {/* ... inputs ... */}
                                    <input
                                        type="text"
                                        placeholder="Title"
                                        value={uploadData.title}
                                        onChange={e => setUploadData({ ...uploadData, title: e.target.value })}
                                        required
                                    />
                                    <textarea
                                        placeholder="Description"
                                        value={uploadData.description}
                                        onChange={e => setUploadData({ ...uploadData, description: e.target.value })}
                                        required
                                    />
                                    <div className={styles.fileInput}>
                                        <label>Video File</label>
                                        <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} required />
                                    </div>
                                    <div className={styles.fileInput}>
                                        <label>Thumbnail</label>
                                        <input type="file" accept="image/*" onChange={e => setThumbnail(e.target.files[0])} required />
                                    </div>
                                    <div className={styles.modalActions}>
                                        <button type="button" className="btn btn-ghost" onClick={() => setShowUpload(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary" disabled={uploading}>
                                            Upload
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {showCoverModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        {uploading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <Loader size="md" />
                                <p style={{ marginTop: '1rem' }}>Updating cover...</p>
                            </div>
                        ) : (
                            <>
                                <h2>Update Cover Image</h2>
                                <form onSubmit={handleUpdateCover} className={styles.uploadForm}>
                                    <div className={styles.fileInput}>
                                        <label>Cover Image</label>
                                        <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files[0])} required />
                                    </div>
                                    <div className={styles.modalActions}>
                                        <button type="button" className="btn btn-ghost" onClick={() => setShowCoverModal(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary" disabled={uploading}>
                                            Update
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {showPlaylistModal && <PlaylistModal videoId={selectedVideoId} onClose={() => setShowPlaylistModal(false)} />}
        </div>
    );
}
