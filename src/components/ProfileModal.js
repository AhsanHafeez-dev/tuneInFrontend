'use client';
import { useRouter } from 'next/navigation';
import styles from './ProfileModal.module.css';
import Link from 'next/link';

export default function ProfileModal({ user, onClose, onLogout }) {
    const router = useRouter();

    if (!user) return null;

    const handleLogout = () => {
        onLogout();
        onClose();
        router.push('/'); // Redirect to home or login after logout
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>

                {user.avatar ? (
                    <img src={user.avatar} alt={user.fullName} className={styles.avatar} />
                ) : (
                    <div className={styles.avatarPlaceholder}>{user.fullName?.[0]?.toUpperCase()}</div>
                )}

                <div className={styles.userInfo}>
                    <h2 className={styles.fullName}>{user.fullName}</h2>
                    <p className={styles.username}>@{user.username}</p>
                    <p className={styles.email}>{user.email}</p>
                </div>

                {/* Optional: Show stats if available in user object, or fetch them if needed. 
                   Assuming user object might strictly be auth info, so skipping stats for now unless available. 
                   If channel info is merged into user object: */}
                {/* <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>-</span>
                        <span className={styles.statLabel}>Subscribers</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>-</span>
                        <span className={styles.statLabel}>Videos</span>
                    </div>
                </div> */}

                <div className={styles.actions}>
                    <Link href="/settings" className={styles.settingsBtn} onClick={onClose}>
                        ⚙️ Settings
                    </Link>
                    <Link href={`/c/${user.username}`} className={styles.viewChannelBtn} onClick={onClose}>
                        View Channel
                    </Link>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
