'use client';
import { useState, useEffect } from 'react';
import apiClient from '@/utils/apiClient';
import styles from './TweetSection.module.css';
import { useAuth } from '@/context/AuthContext';
import TweetItem from './TweetItem';

export default function TweetSection({ userId, isOwner, avatar, fullName }) {
    const { user } = useAuth();
    const [tweets, setTweets] = useState([]);
    const [content, setContent] = useState('');
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        if (userId) {
            fetchTweets();
        }
    }, [userId]);

    const fetchTweets = async () => {
        try {
            const res = await apiClient(`/api/v1/tweets/user/${userId}`);
            const data = await res.json();
            if (res.ok) {
                setTweets(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch tweets", error);
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 10) {
            alert("Maximum 10 images allowed");
            return;
        }

        setImages(prev => [...prev, ...files]);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            // Revoke URL to avoid memory leaks
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!content.trim() && images.length === 0) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('content', content);
        images.forEach(img => {
            formData.append('media', img); // "media" as requested
        });

        try {
            // Note: apiClient handles Authorization header automatically, 
            // but for FormData we generally let browser set Content-Type to multipart/form-data
            // However, our apiClient sets 'Content-Type': 'application/json' if body is present and not FormData.
            // Let's verify apiClient logic.

            const res = await apiClient('/api/v1/tweets', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                setContent('');
                setImages([]);
                setPreviews([]);
                fetchTweets();
            } else {
                alert('Failed to post tweet');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating tweet');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (tweet) => {
        setEditingId(tweet._id || tweet.id);
        setEditContent(tweet.content);
    };

    const handleUpdate = async (tweetId) => {
        try {
            const res = await apiClient(`/api/v1/tweets/${tweetId}`, {
                method: 'PATCH',
                body: JSON.stringify({ content: editContent })
            });

            if (res.ok) {
                setEditingId(null);
                fetchTweets();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (tweetId) => {
        if (!confirm('Are you sure you want to delete this tweet?')) return;
        try {
            const res = await apiClient(`/api/v1/tweets/${tweetId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchTweets();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleLike = async (tweetId) => {
        if (!user) return alert("Please login to like");
        try {
            const res = await apiClient(`/api/v1/likes/toggle/t/${tweetId}`, {
                method: 'POST'
            });
            // For now just refresh or optimistically update
            if (res.ok) fetchTweets();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className={styles.container}>
            {isOwner && (
                <form onSubmit={handleCreate} className={styles.createTweetForm}>
                    <textarea
                        className={styles.tweetInput}
                        placeholder="What's on your mind?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    <div className={styles.imagePreviewGrid}>
                        {previews.map((src, idx) => (
                            <div key={idx} className={styles.imagePreview}>
                                <img src={src} alt="preview" className={styles.previewImg} />
                                <button type="button" onClick={() => removeImage(idx)} className={styles.removeImgBtn}>×</button>
                            </div>
                        ))}
                    </div>

                    <div className={styles.formActions}>
                        <div className={styles.imageUpload}>
                            <label htmlFor="tweet-images" style={{ cursor: 'pointer', color: 'var(--primary)', fontSize: '0.9rem' }}>
                                📷 Add Images
                            </label>
                            <input
                                id="tweet-images"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                            <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: 'gray' }}>
                                {images.length}/10 selected
                            </span>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>
            )}

            <div className={styles.tweetList}>
                {tweets.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'gray' }}>No tweets yet</p>
                ) : (
                    tweets.map(tweet => (
                        <TweetItem
                            key={tweet._id || tweet.id}
                            tweet={tweet}
                            isOwner={isOwner}
                            avatar={avatar}
                            fullName={fullName}
                            onDelete={handleDelete}
                            onUpdate={handleUpdate}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
