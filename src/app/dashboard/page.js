'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import apiClient from '@/utils/apiClient';

import PlaylistModal from '@/components/PlaylistModal';

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({});
    const [videos, setVideos] = useState([]);
    const [showUpload, setShowUpload] = useState(false);

    // Playlist Modal State
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState(null);

    // Upload state
    const [uploadData, setUploadData] = useState({ title: '', description: '' });
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnail, setThumbnail] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [showCoverModal, setShowCoverModal] = useState(false);
    const [coverFile, setCoverFile] = useState(null);

    useEffect(() => {
        // Fetch channel stats & videos
        const fetchDashboardData = async () => {
            try {
                const statsRes = await apiClient('/api/v1/dashboard/stats');
                const videosRes = await apiClient('/api/v1/dashboard/videos');

                if (statsRes.ok) setStats((await statsRes.json()).data);
                if (videosRes.ok) setVideos((await videosRes.json()).data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchDashboardData();
    }, []);

    const handleUpdateCover = async (e) => {
        e.preventDefault();
        setUploading(true);
        const formData = new FormData();
        formData.append('coverImage', coverFile);

        try {
            const res = await apiClient('/api/v1/users/cover-image', {
                method: 'PATCH',
                body: formData
            });
            if (res.ok) {
                setShowCoverModal(false);
                alert('Cover image updated successfully!');
                window.location.reload();
            } else {
                alert('Update failed');
            }
        } catch (error) {
            console.error(error);
            alert('Error updating cover image');
        } finally {
            setUploading(false);
        }
    }

    const handleUpload = async (e) => {
        e.preventDefault();
        setUploading(true);
        const formData = new FormData();
        formData.append('title', uploadData.title);
        formData.append('description', uploadData.description);
        formData.append('videoFile', videoFile);
        formData.append('thumbnail', thumbnail);

        try {
            const res = await apiClient('/api/v1/videos', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setShowUpload(false);
                alert('Video uploaded successfully!');
                // Open playlist modal for the new video
                openAddToPlaylist(data.data.id);
                // Refresh stats and videos (simplified reloading)
                window.location.reload();
            } else {
                alert('Upload failed');
            }
        } catch (error) {
            console.error(error);
            alert('Error uploading');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteVideo = async (videoId) => {
        if (!confirm("Are you sure you want to delete this video?")) return;
        try {
            const res = await apiClient(`/api/v1/videos/${videoId}`, { method: 'DELETE' });
            if (res.ok) {
                setVideos(videos.filter(v => v.id !== videoId));
                setStats(prev => ({ ...prev, totalVideos: prev.totalVideos - 1 }));
            } else {
                alert("Failed to delete video");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleTogglePublish = async (videoId) => {
        try {
            const res = await apiClient(`/api/v1/videos/toggle/publish/${videoId}`, { method: 'PATCH' });
            const data = await res.json();
            if (res.ok) {
                setVideos(videos.map(v => v.id === videoId ? { ...v, isPublished: data.data.isPublished } : v));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const openPlaylistManager = () => {
        setSelectedVideoId(null);
        setShowPlaylistModal(true);
    };

    const openAddToPlaylist = (vidId) => {
        setSelectedVideoId(vidId);
        setShowPlaylistModal(true);
    };

    if (!user) return <div className="loading">Please login to view dashboard</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Channel Dashboard</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => setShowCoverModal(true)}>Update Cover</button>
                    <button className="btn btn-secondary" onClick={openPlaylistManager}>Create Playlist</button>
                    <button className="btn btn-primary" onClick={() => setShowUpload(true)}>+ Upload Video</button>
                </div>
            </div>

            <div className={styles.statsGrid}>
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
                {videos.map(video => (
                    <div key={video.id} className={styles.videoItem}>
                        <img src={video.thumbnail} alt={video.title} className={styles.videoThumb} />
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
                ))}
            </div>

            {showUpload && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Upload new video</h2>
                        <form onSubmit={handleUpload} className={styles.uploadForm}>
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
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCoverModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Update Cover Image</h2>
                        <form onSubmit={handleUpdateCover} className={styles.uploadForm}>
                            <div className={styles.fileInput}>
                                <label>Cover Image</label>
                                <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files[0])} required />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowCoverModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={uploading}>
                                    {uploading ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPlaylistModal && <PlaylistModal videoId={selectedVideoId} onClose={() => setShowPlaylistModal(false)} />}
        </div>
    );
}
