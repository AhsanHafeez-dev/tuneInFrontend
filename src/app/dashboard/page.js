'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import apiClient from '@/utils/apiClient';

import Loader from '@/components/Loader';
import PlaylistModal from '@/components/PlaylistModal';

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth(); // rename loading to avoid conflict if needed, or just useAuth loading
    const [stats, setStats] = useState({});
    const [videos, setVideos] = useState([]);
    const [showUpload, setShowUpload] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

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
        // Direct Upload Strategy
        try {
            // 1. Get Signature
            const sigRes = await apiClient('/api/v1/videos/signature');
            if (!sigRes.ok) throw new Error('Failed to get upload signature');
            const { signature, timestamp, api_key, cloud_name } = (await sigRes.json()).data;

            const uploadToCloudinary = async (file, resourceType = 'auto') => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('api_key', api_key);
                formData.append('timestamp', timestamp);
                formData.append('signature', signature);
                formData.append('resource_type', resourceType);

                const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/${resourceType}/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Cloudinary upload failed');
                return await response.json();
            };

            // 2. Upload Files Directly
            // Separate uploads for parallel execution
            const [videoUpload, thumbUpload] = await Promise.all([
                uploadToCloudinary(videoFile, 'video'),
                uploadToCloudinary(thumbnail, 'image')
            ]);

            // 3. Send Metadata to Backend
            const backendData = {
                title: uploadData.title,
                description: uploadData.description,
                videoUrl: videoUpload.secure_url,
                thumbnailUrl: thumbUpload.secure_url,
                videoPublicId: videoUpload.public_id,
                thumbnailPublicId: thumbUpload.public_id,
                duration: videoUpload.duration
            };

            const res = await apiClient('/api/v1/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backendData)
            });

            if (res.ok) {
                const data = await res.json();
                setShowUpload(false);
                alert('Video uploaded successfully!');
                openAddToPlaylist(data.data.id);
                window.location.reload();
            } else {
                alert('Upload failed');
            }
        } catch (error) {
            console.error(error);
            alert('Error uploading: ' + error.message);
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


    if (authLoading || (user && loadingData)) return <Loader size="lg" />;
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
                {videos.length === 0 ? (
                    <p style={{ color: 'gray' }}>No videos uploaded yet.</p>
                ) : (
                    videos.map(video => (
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
                    ))
                )}
            </div>

            {showUpload && (
                <div className={styles.modalOverlay}>
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
