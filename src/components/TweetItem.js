'use client';
import { useState } from 'react';
import apiClient from '@/utils/apiClient';
import styles from './TweetSection.module.css';
import ImageSlider from './ImageSlider';
import CommentSection from './comments/CommentSection';
import { useAuth } from '@/context/AuthContext';

export default function TweetItem({ tweet, isOwner, avatar, fullName, onDelete, onUpdate }) {
    const { user } = useAuth();
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState(tweet.content);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [likeCount, setLikeCount] = useState(tweet.likesCount || 0);
    const [isLiked, setIsLiked] = useState(tweet.isLiked || false);

    const handleEdit = () => {
        setEditing(true);
    };

    const handleSave = async () => {
        if (editContent.trim() === tweet.content) {
            setEditing(false);
            return;
        }
        await onUpdate(tweet._id || tweet.id, editContent);
        setEditing(false);
    };

    const handleLike = async () => {
        if (!user) return alert("Please login to like");
        try {
            const res = await apiClient(`/api/v1/likes/toggle/t/${tweet._id || tweet.id}`, {
                method: 'POST'
            });
            if (res.ok) {
                // Toggle locally
                const wasLiked = isLiked;
                setIsLiked(!wasLiked);
                setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const toggleComments = async () => {
        if (!showComments) {
            setShowComments(true);
            if (comments.length === 0) {
                fetchComments();
            }
        } else {
            setShowComments(false);
        }
    };

    const fetchComments = async () => {
        setCommentsLoading(true);
        try {
            // Updated to use the generic endpoint with tweetId
            const res = await apiClient(`/api/v1/comments/t/${tweet._id || tweet.id}`);
            const data = await res.json();
            if (res.ok) {
                setComments(data.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setCommentsLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await apiClient(`/api/v1/comments/t/${tweet._id || tweet.id}`, {
                method: 'POST',
                body: JSON.stringify({ content: newComment })
            });
            if (res.ok) {
                setNewComment('');
                fetchComments();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className={styles.tweetCard}>
            <div className={styles.tweetHeader}>
                <img
                    src={tweet.owner?.avatar || avatar || "https://via.placeholder.com/40"}
                    alt="avatar"
                    className={styles.avatar}
                />
                <div className={styles.tweetMeta}>
                    <span className={styles.userName}>{tweet.owner?.fullName || fullName || "User"}</span>
                    <span className={styles.tweetDate}>{new Date(tweet.createdAt).toLocaleDateString()}</span>
                </div>
                {isOwner && (
                    <button onClick={() => onDelete(tweet._id || tweet.id)} className={styles.menuBtn} title="Delete">
                        🗑️
                    </button>
                )}
            </div>

            {editing ? (
                <div className={styles.editForm}>
                    <textarea
                        className={styles.tweetInput}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                    />
                    <div style={{ marginTop: '10px' }}>
                        <button onClick={handleSave} className={styles.saveBtn}>Save</button>
                        <button onClick={() => setEditing(false)} className={styles.cancelBtn}>Cancel</button>
                    </div>
                </div>
            ) : (
                <>
                    <p className={styles.tweetContent}>{tweet.content}</p>

                    {/* Image Slider */}
                    {tweet.multimedia && tweet.multimedia.length > 0 && (
                        <ImageSlider images={tweet.multimedia} />
                    )}

                    <div className={styles.tweetActions}>
                        <button
                            onClick={handleLike}
                            className={styles.actionBtn}
                            style={{ color: isLiked ? 'var(--primary)' : '' }}
                        >
                            👍 {likeCount}
                        </button>
                        <button onClick={toggleComments} className={styles.actionBtn}>
                            💬 {comments.length > 0 ? comments.length : ''} Comments
                        </button>
                        {isOwner && (
                            <button onClick={handleEdit} className={styles.actionBtn}>
                                ✏️ Edit
                            </button>
                        )}
                    </div>

                    {showComments && (
                        <div className={styles.commentsSectionWrapper} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                            {user && (
                                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Write a comment..."
                                        style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid #444', color: 'white', padding: '5px' }}
                                    />
                                    <button type="submit" className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>Post</button>
                                </form>
                            )}

                            {commentsLoading ? (
                                <p style={{ fontSize: '0.8rem', color: 'gray' }}>Loading comments...</p>
                            ) : (
                                <CommentSection
                                    comments={comments}
                                    entityId={tweet._id || tweet.id}
                                    user={user}
                                    onRefresh={fetchComments}
                                />
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
