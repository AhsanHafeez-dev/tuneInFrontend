'use client';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import PlaylistModal from '@/components/PlaylistModal';
import apiClient from '@/utils/apiClient';
import ReactMarkdown from 'react-markdown';


const formatTime = (durationInSeconds) => {
    if (!durationInSeconds) return "0:00";

    const h = Math.floor(durationInSeconds / 3600);
    const m = Math.floor((durationInSeconds % 3600) / 60);
    const s = Math.floor(durationInSeconds % 60);

    // Pad minutes with '0' only if we are showing hours
    const mString = h > 0 ? m.toString().padStart(2, "0") : m.toString();
    // Always pad seconds
    const sString = s.toString().padStart(2, "0");

    return h > 0 ? `${h}:${mString}:${sString}` : `${mString}:${sString}`;
};

// --- Comment Components moved to @/components/comments/CommentSection ---
import CommentSection from '@/components/comments/CommentSection';



import { useRef } from 'react';

export default function WatchPage() {
    const { videoId } = useParams();
    const videoRef = useRef(null);
    // console.log("got from params", videoId);

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
    const [lastSentBucket, setLastSentBucket] = useState(0);

    // Playlist State
    const [playlist, setPlaylist] = useState(null);
    const [suggestedVideos, setSuggestedVideos] = useState([]);

    const fetchVideo = async () => {
        try {

            const res = await apiClient(
                `https://tune-in-backend.vercel.app/api/v1/videos/c/${videoId}`
            );

            const data = await res.json();
            // console.log(data);


            if (res.ok) {
                // console.log("video data that i got is ", data.data);

                setVideo(data.data);
                checkSubscription(data.data.owner?.id);
                fetchSuggestedVideos();
                setIsLiked(data.data?.isLiked);
                setIsSubscribed(data.data?.isSubscribed);

                if (data.data?.watchedTill && videoRef.current) {
                    const startTime = data.data.watchedTill;
                    // Small delay or check readyState might be safer, but direct set often works if element exists
                    if (videoRef.current) {
                        videoRef.current.currentTime = startTime;
                    }
                }

                // console.log("setting is Liked", data.data);

            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuggestedVideos = async () => {
        try {
            // console.log(`suggesting for videoId ${videoId}`);

            // Fetch random videos or latest
            const res = await apiClient(
                `https://tune-in-backend.vercel.app/api/v1/videos/suggested/${videoId}`
            );
            // console.log("await finish for suggested video");

            const data = await res.json();
            // console.log(data.data);

            if (res.ok) {
                // Filter out current video
                const others = (data.data || [])


                setSuggestedVideos(others);
                // console.log("suggested vieos", suggestedVideos);

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


            if (res.ok) {
                setComments(data.data);
                console.log("comments response", data.data[0]?.replies);
            }
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

            if (res.ok) setIsLiked(Object.keys(data.data).length > 0);
        } catch (error) {
            console.error(error);
        }
    }

    const toggleSubscribe = async () => {
        if (!user) return alert('Please login to subscribe');
        try {
            const res = await apiClient(
                `https://tune-in-backend.vercel.app/api/v1/subscriptions/c/${video.owner?.id}`,
                { method: "POST" }
            );
            const data = await res.json();
            if (res.ok) setIsSubscribed(data.data.subscribed);
        } catch (error) {
            console.error(error);
        }
    }

    const addToHistory = async () => {
        if (!user) return;
        try {
            await apiClient('/api/v1/users/history', {
                method: 'POST',
                body: JSON.stringify({ videoId })
            });
        } catch (error) {
            console.error("Failed to add to history", error);
        }
    };

    const updateHistory = async (time) => {
        if (!user) return;
        try {
            await apiClient('/api/v1/users/history', {
                method: 'PATCH',
                body: JSON.stringify({ videoId, watchTime: time })
            });
        } catch (error) {
            console.error("Failed to update history", error);
        }
    }

    const handleTimeUpdate = (e) => {
        const currentTime = e.target.currentTime;
        const currentBucket = Math.floor(currentTime / 5);

        // Update history if bucket changes (allows forward and backward updates)
        // Check currentBucket > 0 to avoid spamming 0 updates immediately on load if not needed
        if (currentBucket !== lastSentBucket && currentBucket > 0) {
            updateHistory(currentBucket * 5);
            setLastSentBucket(currentBucket);
        }
    }

    useEffect(() => {
        if (videoId) {
            setLastSentBucket(0);
            fetchVideo();
            fetchComments();
            addToHistory();
        }
        if (playlistId) {
            fetchPlaylist();
        }
    }, [videoId, playlistId, user]);

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
                        ref={videoRef}
                        src={video.videoFile}
                        poster={video.thumbnail}
                        controls
                        autoPlay
                        className={styles.videoPlayer}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={() => {
                            if (video.watchedTill && videoRef.current) {
                                videoRef.current.currentTime = video.watchedTill;
                            }
                        }}
                    />
                </div>
                <div className={styles.info}>
                    <h1 className={styles.title}>{video.title}</h1>
                    <div className={styles.actions}>
                        <Link href={`/c/${video.owner?.userName}`} className={styles.channel}>
                            {video.owner?.avatar ? (
                                <img src={video.owner?.avatar} alt={video.owner?.fullName} className={styles.avatarPlaceholder} style={{ objectFit: 'cover' }} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>{video.owner?.fullName?.[0]}</div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span>{video.owner?.fullName}</span>
                                <span style={{ fontSize: '0.8rem', color: 'gray' }}>{video.owner?.subscribersCount || 0} subscribers</span>
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
                        <ReactMarkdown>{video.description}</ReactMarkdown>
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
                            entityId={videoId}
                            user={user}
                            onRefresh={fetchComments}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.sidebar}>
                {playlist && playlist.videos && (
                    <div className={styles.playlistQueue}>
                        <div className={styles.queueHeader}>
                            <h3>{playlist.name}</h3>
                            <span style={{ fontSize: '0.85rem', color: 'gray' }}>{playlist.owner?.fullName} - {playlist.totalVideos || playlist.videos?.length} videos</span>
                        </div>
                        <div className={styles.queueList}>
                            {playlist.videos.map(v => (
                                <Link
                                    href={`/watch/${v.video?.id || v?._id}?list=${playlist?.id || playlist?._id}`}
                                    key={v.video?.id || v?._id}
                                    className={`${styles.queueItem} ${v.video?.id === videoId ? styles.queueItemActive : ''}`}
                                >
                                    <img src={v.video.thumbnail} alt={v.video.title} className={styles.queueThumb} />
                                    <div className={styles.queueInfo}>
                                        <h4 className={styles.queueTitle}>{v.video.title}</h4>
                                        <span className={styles.queueChannel}>{v.video.owner?.fullName}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className={styles.suggestedList}>
                    <h3>Suggested Videos</h3>
                    {suggestedVideos.map(v => (
                        <Link
                            href={`/watch/${v?.id || v?._id}`}
                            key={v?.id || v?._id}
                            className={styles.queueItem}
                        >
                            <div className={styles.queueThumbWrapper}>
                                <img src={v.thumbnail} alt={v.title} className={styles.queueThumb} />
                                <span className={styles.suggestedDuration}>
                                    {
                                        formatTime(v.duration)
                                    }
                                </span>
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
            </div>

            {showPlaylistModal && <PlaylistModal videoId={videoId} onClose={() => setShowPlaylistModal(false)} />}
        </div>
    );
}
