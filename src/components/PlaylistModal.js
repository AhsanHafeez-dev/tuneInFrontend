'use client';
import { useState, useEffect } from 'react';
import styles from './PlaylistModal.module.css';

export default function PlaylistModal({ videoId, onClose }) {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' or 'create'
    const [newPlaylistData, setNewPlaylistData] = useState({ name: '', description: '' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchUserPlaylists();
    }, []);

    const fetchUserPlaylists = async () => {
        try {
            const userRes = await fetch('/api/v1/users/current-user');
            if (!userRes.ok) throw new Error('Not logged in');
            const userData = await userRes.json();
            const userId = userData.data._id;

            const res = await fetch(`/api/v1/playlist/user/${userId}`);
            const data = await res.json();
            if (res.ok) {
                setPlaylists(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlaylist = async (e) => {
        e.preventDefault();
        if (!newPlaylistData.name.trim()) return;
        setCreating(true);
        try {
            const res = await fetch('/api/v1/playlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPlaylistData)
            });
            const data = await res.json();
            if (res.ok) {
                setPlaylists([...playlists, data.data]);
                setNewPlaylistData({ name: '', description: '' });
                setView('list'); // Go back to list
                if (videoId) {
                    // Optional: automatically adding the video to the new playlist is a good UX but let's let user decide
                }
            } else {
                alert(data.message || 'Failed to create playlist');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating playlist');
        } finally {
            setCreating(false);
        }
    };

    const toggleVideoInPlaylist = async (playlistId, isPresent) => {
        // ... (same implementation as before) 
        // Note for tool: preserving the logic is expensive with replace, I will rewrite it to be safe
        try {
            const endpoint = isPresent
                ? `/api/v1/playlist/remove/${videoId}/${playlistId}`
                : `/api/v1/playlist/add/${videoId}/${playlistId}`;

            const res = await fetch(endpoint, { method: 'PATCH' });
            if (res.ok) {
                alert(`Video ${isPresent ? 'removed from' : 'added to'} playlist`);
                // Optimistic update could happen here
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>{view === 'create' ? 'New Playlist' : (videoId ? 'Save to...' : 'My Playlists')}</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                {view === 'list' && (
                    <>
                        {loading ? (
                            <div>Loading playlists...</div>
                        ) : (
                            <div className={styles.list}>
                                {playlists.length === 0 && <p style={{ textAlign: 'center', color: 'gray' }}>No playlists found</p>}
                                {playlists.map(playlist => (
                                    <div key={playlist._id} className={styles.item}>
                                        <span className={styles.name}>{playlist.name}</span>
                                        {videoId && (
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => toggleVideoInPlaylist(playlist._id, false)}
                                            >
                                                Add
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        <button
                            className={styles.newPlaylistBtn}
                            onClick={() => setView('create')}
                        >
                            + Create New Playlist
                        </button>
                    </>
                )}

                {view === 'create' && (
                    <form onSubmit={handleCreatePlaylist} className={styles.createForm}>
                        <div className={styles.field}>
                            <label>Name</label>
                            <input
                                type="text"
                                value={newPlaylistData.name}
                                onChange={(e) => setNewPlaylistData({ ...newPlaylistData, name: e.target.value })}
                                required
                                className={styles.input}
                                autoFocus
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Description (Optional)</label>
                            <textarea
                                value={newPlaylistData.description}
                                onChange={(e) => setNewPlaylistData({ ...newPlaylistData, description: e.target.value })}
                                className={styles.textarea}
                            />
                        </div>
                        <div className={styles.formActions}>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setView('list')}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={creating}
                            >
                                {creating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
