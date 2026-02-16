'use client';
import { useState } from 'react';
import apiClient from '@/utils/apiClient';
import styles from './CommentSection.module.css';

export default function CommentItem({ comment, entityId, user, onRefresh }) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [liked, setLiked] = useState(comment.isLiked || false);
    const [showReplies, setShowReplies] = useState(false);

    const handleReplyClick = () => {
        if (!user) return alert("Please login to reply");
        setIsReplying(!isReplying);
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        try {
            // Updated endpoint for replies: /api/v1/comments/c/:commentId
            const res = await apiClient(
                `/api/v1/comments/c/${comment?.id}`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        content: replyContent,
                    }),
                }
            );
            if (res.ok) {
                setReplyContent('');
                setIsReplying(false);
                onRefresh(); // Refresh paren to show new reply
                setShowReplies(true);
            } else {
                alert("Failed to post reply");
            }
        } catch (error) {
            console.error(error);
            alert("Error posting reply");
        }
    };

    const handleLike = async () => {
        if (!user) return alert("Please login to like");
        try {
            const res = await apiClient(
                `/api/v1/likes/toggle/c/${comment?.id}`,
                { method: "POST" }
            );
            if (res.ok) {
                const data = await res.json();
                setLiked(Object.keys(data.data).length > 0);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const repliesCount = comment.replies?.length || 0;

    return (
        <div className={styles.commentItem}>
            <div className={styles.commentHeader}>
                <div className={styles.avatarPlaceholder}>
                    {comment.owner?.avatar ? <img src={comment.owner?.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'U'}
                </div>
                <span className={styles.commentUser}>
                    {comment.owner?.userName || 'User'}
                    <span className={styles.commentDate}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                </span>
            </div>
            <p className={styles.commentContent}>{comment.content}</p>

            <div className={styles.commentActions}>
                <button type="button" onClick={handleLike} className={`${styles.actionBtn} ${liked ? styles.liked : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    👍 {comment.likesCount + (liked && !comment.isLiked ? 1 : 0) - (!liked && comment.isLiked ? 1 : 0) || 0} {/* Optimistic count update logic simplified or just trust refresh? */}
                    {/* The original code just used comment.likesCount. Since we don't refresh immediately on like, optimistic update is nice but tricky without local count state. 
                       I'll stick to simple display or rely on 'liked' state visual. 
                       The previous code: {comment.likesCount || 0}
                    */}
                </button>
                <button type="button" onClick={handleReplyClick} className={styles.actionBtn}>
                    {isReplying ? 'Cancel' : 'Reply'}
                </button>
            </div>

            {isReplying && (
                <form onSubmit={handleReplySubmit} className={styles.replyForm}>
                    <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`Reply to ${comment.owner?.fullName || 'user'}...`}
                        className={styles.replyInput}
                        autoFocus
                    />
                    <div className={styles.replyButtons}>
                        <button type="button" onClick={() => setIsReplying(false)} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Reply</button>
                    </div>
                </form>
            )}

            {/* Replies Logic */}
            {repliesCount > 0 && (
                <div className={styles.repliesContainer}>
                    <button
                        className={styles.viewRepliesBtn}
                        onClick={() => setShowReplies(!showReplies)}
                    >
                        {showReplies ? '▲' : '▼'} {showReplies ? 'Hide' : `View ${repliesCount}`} replies
                    </button>

                    {showReplies && (
                        <div className={styles.nestedReplies}>
                            {comment.replies.map(reply => (
                                <CommentItem
                                    key={reply?.id}
                                    comment={reply}
                                    entityId={entityId}
                                    user={user}
                                    onRefresh={onRefresh}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
