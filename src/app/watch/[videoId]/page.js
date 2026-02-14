'use client';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import PlaylistModal from '@/components/PlaylistModal';
import apiClient from '@/utils/apiClient';

// --- Comment Components ---

function CommentItem({ comment, videoId, user, onRefresh }) {
    console.log("mapping",comment);
    
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [liked, setLiked] = useState(false);
    // Ideally liked state comes from backend 'comment.isLiked'

    const handleReplyClick = () => {
        if (!user) return alert("Please login to reply");
        setIsReplying(!isReplying);
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        try {
            const res = await apiClient(
                `https://tune-in-backend.vercel.app/api/v1/comments/${videoId}`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        content: replyContent,
                        parentComment: comment.id,
                    }),

                }
            );
            if (res.ok) {
                setReplyContent('');
                setIsReplying(false);
                onRefresh();
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
                `https://tune-in-backend.vercel.app/api/v1/likes/toggle/c/${comment.id}`,
                { method: "POST", }
            );
            if (res.ok) {
                const data = await res.json();
                setLiked(Object.keys(data.data).length>0  );
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className={styles.commentItem}>
            <div className={styles.commentHeader}>
                <div className={styles.avatarPlaceholder} style={{ width: 30, height: 30, fontSize: '0.8rem' }}>
                    {comment.owner?.avatar ? <img src={comment.owner?.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : 'U'}
                </div>
                <span className={styles.commentUser}>
                    {comment.owner?.userName || 'User'}
                    <span className={styles.commentDate}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                </span>
            </div>
            <p className={styles.commentContent}>{comment.content}</p>

            <div className={styles.commentActions}>
                <button type="button" onClick={handleLike} className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}>
                    👍 Like
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

            {/* Render Replies in nested container */}
            {comment.replies && comment.replies.length > 0 && (
                <div className={styles.nestedReplies}>
                    {comment.replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            videoId={videoId}
                            user={user}
                            onRefresh={onRefresh}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function CommentSection({ comments, videoId, user, onRefresh }) {
    // Group comments into hierarchy
    // Assuming backend returns flat list, we build tree here
    const buildTree = (list) => {
        const map = {};
        const roots = [];
        // Init map
        list?.forEach((c) => {
            map[String(c.id)] = { ...c, replies: [] };
        });
        // Build tree
        list?.forEach(c => {
            const id = String(c.id);
            const parentId = c.parentComment ? String(c.parentComment) : null;

            if (parentId && map[parentId]) {
                map[parentId].replies.push(map[id]);
            } else {
                roots.push(map[id]);
            }
        });
        return roots;
    };

    const commentTree = buildTree(comments);

    return (
        <div className={styles.tree}>
            {commentTree.map(c => (
                <CommentItem key={c.id} comment={c} videoId={videoId} user={user} onRefresh={onRefresh} />
            ))}
        </div>
    );
}



export default function WatchPage() {
    const { videoId } = useParams();
    console.log("got from params", videoId);

    const searchParams = useSearchParams();
    const playlistId = searchParams.get('list');

    const { user } = useAuth();
    const [video, setVideo] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);

    // Playlist State
    const [playlist, setPlaylist] = useState(null);
    const [suggestedVideos, setSuggestedVideos] = useState([]);

    const fetchVideo = async () => {
        try {
            const res = await apiClient(
                `https://tune-in-backend.vercel.app/api/v1/videos/${videoId}`
            );

            const data = await res.json();
            console.log(data);
            

            if (res.ok) {
                setVideo(data.data);
                checkSubscription(data.data.owner.id);
                fetchSuggestedVideos();
                setIsLiked(video?.isLiked);
                console.log("setting is Liked",video?.isLiked);
                
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuggestedVideos = async () => {
        try {
            // Fetch random videos or latest
            const res = await apiClient(
                `https://tune-in-backend.vercel.app/api/v1/videos?page=1&limit=15`
            );
            const data = await res.json();
            if (res.ok) {
                // Filter out current video
                const others = (data.data.docs || []).filter(v => v.id !== videoId);
                setSuggestedVideos(others);
                console.log("suggested vieos", suggestedVideos);

            }
        } catch (error) {
            console.error("Failed to fetch suggestions", error);
        }
    }

    const fetchPlaylist = async () => {
        if (!playlistId) return;
        try {
            const res = await apiClient(
                `https://tune-in-backend.vercel.app/api/v1/playlist/${playlistId}`
            );
            const data = await res.json();
            if (res.ok) {
                setPlaylist(data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Fetch comments
    const fetchComments = async () => {
        try {
            const res = await apiClient(
                `https://tune-in-backend.vercel.app/api/v1/comments/${videoId}?page=1&limit=10`
            );
            const data = await res.json();
            console.log("comments response",data);
            
            if (res.ok) setComments(data.data);
        } catch (error) {
            console.error(error);
        }
    }

    const checkSubscription = async (channelId) => {
        if (!user) return;
        // In a real app we'd have an endpoint to check specific status, 
        // or we iterate getUserChannelSubscribers. For now, assuming optimistic toggle or manual check
        // Simplified: defaulting to false, real check requires `subscriptions/c/:channelId` endpoint or similar
    };

    const toggleLike = async () => {
        if (!user) return alert('Please login to like');
        try {
            const res = await apiClient(
                `https://tune-in-backend.vercel.app/api/v1/likes/toggle/v/${videoId}`,
                { method: "POST" }
            );
            const data = await res.json();

            if (res.ok) setIsLiked(Object.keys(data.data).length>0);
        } catch (error) {
            console.error(error);
        }
    }

    const toggleSubscribe = async () => {
        if (!user) return alert('Please login to subscribe');
        try {
            const res = await apiClient(
                `https://tune-in-backend.vercel.app/api/v1/subscriptions/c/${video.owner.id}`,
                { method: "POST" }
            );
            const data = await res.json();
            if (res.ok) setIsSubscribed(data.data.subscribed);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        if (videoId) {
            fetchVideo();
            fetchComments();
        }
        if (playlistId) {
            fetchPlaylist();
        }
    }, [videoId, playlistId]);

    const handleComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const res = await apiClient(
                `https://tune-in-backend.vercel.app/api/v1/comments/${videoId}`,
                {
                    method: "POST",
                    body: JSON.stringify({ content: newComment }),
                }
            );
            if (res.ok) {
                setNewComment('');
                fetchComments();
                
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="loading">Loading player...</div>;
    if (!video) return <div className="loading">Video not found</div>;
    
    
    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <div className={styles.playerWrapper}>
                    <video
                        src={video.videoFile}
                        poster={video.thumbnail}
                        controls
                        autoPlay
                        className={styles.videoPlayer}
                    />
                </div>
                <div className={styles.info}>
                    <h1 className={styles.title}>{video.title}</h1>
                    <div className={styles.actions}>
                        <Link href={`/c/${video.owner?.userName}`} className={styles.channel}>
                            {video.owner.avatar ? (
                                <img src={video.owner.avatar} alt={video.owner.fullName} className={styles.avatarPlaceholder} style={{ objectFit: 'cover' }} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>{video.owner.fullName?.[0]}</div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span>{video.owner.fullName}</span>
                                <span style={{ fontSize: '0.8rem', color: 'gray' }}>{video.owner.subscribersCount || 0} subscribers</span>
                            </div>
                        </Link>
                        <div className={styles.buttons}>
                            <button
                                className={`btn ${isLiked ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={toggleLike}
                                style={{ minWidth: '100px' }}
                            >
                                {isLiked ? '👍 Liked' : '👍 Like'} {video.likesCount > 0 && <span>| {video.likesCount + (isLiked ? 0 : 0)} </span>}
                            </button>
                            <button
                                className={`btn ${isSubscribed ? 'btn-secondary' : 'btn-primary'}`}
                                onClick={toggleSubscribe}
                                style={{
                                    background: isSubscribed ? '#333' : '', /* Dark Grey if subscribed, Default Red if not */
                                    color: 'white'
                                }}
                            >
                                {isSubscribed ? 'Subscribed' : 'Subscribe'}
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowPlaylistModal(true)}
                            >
                                💾 Save
                            </button>
                        </div>
                    </div>
                    <div className={styles.description}>
                        <p>{video.description}</p>
                    </div>
                </div>

                <div className={styles.commentsSection}>
                    <h3>{comments?.length} Comments</h3>
                    {user && (
                        <form onSubmit={handleComment} className={styles.commentForm}>
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className={styles.commentInput}
                            />
                            <button type="submit" className="btn btn-primary">Comment</button>
                        </form>
                    )}
                    <div className={styles.commentsList}>
                        {/* Recursive Comment Component */}
                        <CommentSection
                            comments={comments}
                            videoId={videoId}
                            user={user}
                            onRefresh={fetchComments}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.sidebar}>
                {/* Could add Related Videos here if playlist is null, but for this task we focus on playlist */}
                {playlist && playlist.videos ? (
                    <div className={styles.playlistQueue}>
                        <div className={styles.queueHeader}>
                            <h3>{playlist.name}</h3>
                            <span style={{ fontSize: '0.85rem', color: 'gray' }}>{playlist.owner?.fullName} - {playlist.totalVideos || playlist.videos?.length} videos</span>
                        </div>
                        <div className={styles.queueList}>
                            {playlist.videos.map(v => (
                                <Link
                                    href={`/watch/${v.id}?list=${playlist.id}`}
                                    key={v.id}
                                    className={`${styles.queueItem} ${v.id === videoId ? styles.queueItemActive : ''}`}
                                >
                                    <img src={v.thumbnail} alt={v.title} className={styles.queueThumb} />
                                    <div className={styles.queueInfo}>
                                        <h4 className={styles.queueTitle}>{v.title}</h4>
                                        <span className={styles.queueChannel}>{v.owner?.fullName}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className={styles.suggestedList}>
                        {suggestedVideos.map(v => (
                            <Link
                                href={`/watch/${v.id}`}
                                key={v.id}
                                className={styles.queueItem}
                                onClick={(event) => {
                                    console.log(event.target);
                                }}
                            >
                                <div className={styles.queueThumbWrapper}>
                                    <img src={v.thumbnail} alt={v.title} className={styles.queueThumb} />
                                    <span className={styles.suggestedDuration}>{Math.floor(v.duration)}s</span>
                                </div>
                                <div className={styles.queueInfo}>
                                    <h4 className={styles.queueTitle} title={v.title}>{v.title}</h4>
                                    <span className={styles.queueChannel}>{v.owner?.fullName}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'gray', display: 'block', marginTop: '2px' }}>
                                        {v.views} views • {new Date(v.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {showPlaylistModal && <PlaylistModal videoId={videoId} onClose={() => setShowPlaylistModal(false)} />}
        </div>
    );
}
