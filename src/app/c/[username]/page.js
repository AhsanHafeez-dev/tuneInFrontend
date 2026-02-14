"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function ChannelPage() {
  const { username } = useParams();
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [activeTab, setActiveTab] = useState("videos");
  const [playlists, setPlaylists] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [newTweetContent, setNewTweetContent] = useState("");

  const isOwner =
    user && channel && user?.id?.toString() === channel?.id?.toString();

  useEffect(() => {
    if (username) {
      fetchChannelProfile();
    }
  }, [username]);

  useEffect(() => {
    if (!channel) return;
    if (activeTab === "tweets") {
      fetchTweets();
    }
  }, [activeTab, channel]);

  const fetchChannelProfile = async () => {
    try {
      console.log(`fetching user ${username}`);
      
      const res = await fetch(`/api/v1/users/c/${username}`);
      const data = await res.json();
      if (res.ok) {
        setChannel(data.data);
        setIsSubscribed(data.data.isSubscribed);
        fetchChannelVideos(data.data.id);
        fetchChannelPlaylists(data.data.id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannelVideos = async (userId) => {
    try {
      console.log(`fetching videos for id ${userId}`);
      
      const res = await fetch(
        `/api/v1/videos?userId=${userId}&page=1&limit=50`
      );
      const data = await res.json();
      if (res.ok) {
        setVideos(data.data.docs || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchChannelPlaylists = async (userId) => {
    try {
      const res = await fetch(`/api/v1/playlist/user/${userId}`);
      const data = await res.json();
      if (res.ok) {
        setPlaylists(data.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTweets = async () => {
    if (!channel) return;
    try {
      const res = await fetch(`/api/v1/tweets/user/${channel.id}`);
      const data = await res.json();
      if (res.ok) setTweets(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleSubscribe = async () => {
    if (!user) return alert("Please login to subscribe");
    try {
      const res = await fetch(`/api/v1/subscriptions/c/${channel.id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setIsSubscribed(data.data.subscribed);
        if (data.data.subscribed) {
          setChannel((prev) => ({
            ...prev,
            subscribersCount: (prev.subscribersCount || 0) + 1,
          }));
        } else {
          setChannel((prev) => ({
            ...prev,
            subscribersCount: (prev.subscribersCount || 0) - 1,
          }));
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateTweet = async (e) => {
    e.preventDefault();
    if (!newTweetContent.trim()) return;
    try {
      const res = await fetch("/api/v1/tweets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newTweetContent }),
      });

      if (res.ok) {
        setNewTweetContent("");
        fetchTweets();
        alert("Tweet posted!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/v1/tweets/${tweetId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchTweets();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Loading channel...
      </div>
    );
  if (!channel)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Channel not found
      </div>
    );

  return (
    <div className={styles.container}>
      <div className={styles.bannerWrapper}>
        {channel.coverImage ? (
          <img
            src={channel.coverImage}
            alt="Cover"
            className={styles.coverImage}
          />
        ) : (
          <div className={styles.coverPlaceholder} />
        )}
      </div>

      <div className={styles.channelHeader}>
        <div className={styles.avatarWrapper}>
          <img
            src={channel.avatar || "https://via.placeholder.com/150"}
            alt={channel.fullName}
            className={styles.avatar}
          />
        </div>
        <div className={styles.channelInfo}>
          <h1>{channel.fullName}</h1>
          <span className={styles.handle}>@{channel?.username}</span>
          <div className={styles.stats}>
            <span>{channel.subscribersCount} subscribers</span>
            <span>•</span>
            <span>{channel.channelsSubscribedToCount} subscribed</span>
          </div>
        </div>
        <div className={styles.subscribeWrapper}>
          <button
            className={`btn ${isSubscribed ? "btn-secondary" : "btn-primary"}`}
            onClick={toggleSubscribe}
            style={{
              background: isSubscribed ? "var(--card-bg)" : "var(--primary)",
              color: isSubscribed ? "var(--foreground)" : "black",
              border: isSubscribed ? "1px solid var(--gray)" : "none",
            }}
          >
            {isSubscribed ? "Subscribed" : "Subscribe"}
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "videos" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("videos")}
        >
          Videos
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "playlists" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("playlists")}
        >
          Playlists
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "tweets" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("tweets")}
        >
          Tweets
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === "videos" && (
          <div className={styles.videoGrid}>
            {videos.length === 0 ? (
              <p>No videos uploaded yet.</p>
            ) : (
              videos.map((video) => (
                <Link
                  href={`/watch/${video.id}`}
                  key={video.id}
                  className={styles.videoCard}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className={styles.thumbnail}
                  />
                  <div className={styles.cardInfo}>
                    <h3>{video.title}</h3>
                    <span>
                      {video.views} views •{" "}
                      {new Date(video.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === "playlists" && (
          <div className={styles.playlistGrid}>
            {playlists.length === 0 ? (
              <p>No playlists created yet.</p>
            ) : (
              playlists.map((playlist) => {
                const firstVidId = playlist.firstVideo?.id;
                return (
                  <Link
                    href={
                      firstVidId
                        ? `/watch/${firstVidId}?list=${playlist.id}`
                        : "#"
                    }
                    key={playlist.id}
                    className={styles.playlistCard}
                    onClick={(e) => !firstVidId && e.preventDefault()}
                    style={{ cursor: firstVidId ? "pointer" : "default" }}
                  >
                    <div className={styles.playlistThumbWrapper}>
                      {playlist.firstVideo?.thumbnail ? (
                        <img
                          src={playlist.firstVideo.thumbnail}
                          alt={playlist.name}
                          className={styles.thumbnail}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: "var(--secondary)",
                          }}
                        ></div>
                      )}
                      <div className={styles.playlistOverlay}>
                        <span style={{ color: "white", fontWeight: "bold" }}>
                          {playlist.totalVideos}
                        </span>
                        <span
                          style={{
                            color: "white",
                            fontSize: "0.8rem",
                            display: "block",
                          }}
                        >
                          videos
                        </span>
                      </div>
                    </div>
                    <div className={styles.playlistInfo}>
                      <h3 className={styles.playlistTitle}>{playlist.name}</h3>
                      <span className={styles.playlistCount}>
                        View full playlist
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}

        {activeTab === "tweets" && (
          <div className={styles.tweetsContainer}>
            {isOwner && (
              <form
                onSubmit={handleCreateTweet}
                className={styles.createTweetForm}
              >
                <textarea
                  placeholder="Post something to your community..."
                  value={newTweetContent}
                  onChange={(e) => setNewTweetContent(e.target.value)}
                  className={styles.tweetInput}
                  rows={3}
                />
                <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
                  <button type="submit" className="btn btn-primary">
                    Post
                  </button>
                </div>
              </form>
            )}

            <div className={styles.tweetsList}>
              {tweets.map((tweet) => (
                <div key={tweet.id} className={styles.tweetCard}>
                  <div className={styles.tweetHeader}>
                    <div
                      className={styles.avatarPlaceholder}
                      style={{ width: 30, height: 30, fontSize: "0.8rem" }}
                    >
                      {channel.avatar ? (
                        <img
                          src={channel.avatar}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                          }}
                        />
                      ) : (
                        channel.fullName?.[0]
                      )}
                    </div>
                    <div className={styles.tweetMeta}>
                      <span className={styles.tweetUser}>
                        {channel.fullName}
                      </span>
                      <span className={styles.tweetDate}>
                        {new Date(tweet.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteTweet(tweet.id)}
                        className={styles.deleteBtn}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <p className={styles.tweetContent}>{tweet.content}</p>
                  <div className={styles.tweetActions}>
                    <button className={styles.actionBtn}>👍 Like</button>
                    <button className={styles.actionBtn}>👎</button>
                  </div>
                </div>
              ))}
              {tweets.length === 0 && (
                <p style={{ color: "gray", textAlign: "center" }}>
                  No tweets yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
