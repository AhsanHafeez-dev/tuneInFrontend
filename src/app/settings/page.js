'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import apiClient from '@/utils/apiClient';
import Loader from '@/components/Loader';

export default function SettingsPage() {
    const { user, loading: authLoading, checkAuth } = useAuth();

    // Account Details State
    const [accountData, setAccountData] = useState({ fullName: '', email: '' });
    const [accountLoading, setAccountLoading] = useState(false);

    // Password State
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Image State
    const [avatarFile, setAvatarFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [coverLoading, setCoverLoading] = useState(false);

    // Pre-fill data
    useEffect(() => {
        if (user) {
            setAccountData({
                fullName: user.fullName || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const handleUpdateAccount = async (e) => {
        e.preventDefault();
        setAccountLoading(true);
        try {
            const res = await apiClient('/api/v1/users/update-account', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(accountData)
            });
            if (res.ok) {
                alert('Account details updated successfully');
                await checkAuth(); // Refresh user data
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to update account');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setAccountLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordLoading(true);
        try {
            const res = await apiClient('/api/v1/users/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordData)
            });
            if (res.ok) {
                alert('Password changed successfully');
                setPasswordData({ oldPassword: '', newPassword: '' });
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to change password');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleUpdateAvatar = async () => {
        if (!avatarFile) return;
        setAvatarLoading(true);
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        try {
            const res = await apiClient('/api/v1/users/avatar', {
                method: 'PATCH',
                body: formData
            });
            if (res.ok) {
                alert('Avatar updated successfully');
                setAvatarFile(null);
                await checkAuth();
            } else {
                alert('Failed to update avatar');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleUpdateCover = async () => {
        if (!coverFile) return;
        setCoverLoading(true);
        const formData = new FormData();
        formData.append('coverImage', coverFile);

        try {
            const res = await apiClient('/api/v1/users/cover-image', {
                method: 'PATCH',
                body: formData
            });
            if (res.ok) {
                alert('Cover image updated successfully');
                setCoverFile(null);
                await checkAuth();
            } else {
                alert('Failed to update cover image');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setCoverLoading(false);
        }
    };

    if (authLoading) return <Loader size="lg" />;
    if (!user) return <div className="loading">Please login to access settings</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Settings</h1>

            {/* Profile Images Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Profile Images</h2>

                <div className={styles.imageUploadSection}>
                    {/* Cover Image */}
                    <div>
                        <p className={styles.helperText} style={{ marginBottom: '0.5rem' }}>Channel Banner (Cover Image)</p>
                        <div style={{ position: 'relative' }}>
                            {coverFile || user.coverImage ? (
                                <img
                                    src={coverFile ? URL.createObjectURL(coverFile) : user.coverImage}
                                    alt="Cover"
                                    className={styles.coverPreview}
                                />
                            ) : (
                                <div className={styles.coverPreview} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2a2a2a', color: '#888', border: '1px dashed #444' }}>
                                    No Cover Image
                                </div>
                            )}
                        </div>
                        <div className={styles.row} style={{ alignItems: 'center' }}>
                            <label className={styles.uploadBtn}>
                                Choose File
                                <input
                                    type="file"
                                    accept="image/*"
                                    className={styles.fileInput}
                                    onChange={(e) => setCoverFile(e.target.files[0])}
                                />
                            </label>
                            {coverFile && (
                                <button className="btn btn-primary" onClick={handleUpdateCover} disabled={coverLoading}>
                                    {coverLoading ? <Loader size="sm" /> : 'Upload Cover'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Avatar */}
                    <div className={styles.imageRow}>
                        {avatarFile || user.avatar ? (
                            <img
                                src={avatarFile ? URL.createObjectURL(avatarFile) : user.avatar}
                                alt="Avatar"
                                className={styles.preview}
                            />
                        ) : (
                            <div className={styles.preview} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2a2a2a', color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
                                {user.fullName?.[0]?.toUpperCase()}
                            </div>
                        )}
                        <div className={styles.fileInputWrapper}>
                            <p className={styles.helperText}>Profile Picture</p>
                            <div className={styles.row}>
                                <label className={styles.uploadBtn}>
                                    Choose File
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className={styles.fileInput}
                                        onChange={(e) => setAvatarFile(e.target.files[0])}
                                    />
                                </label>
                                {avatarFile && (
                                    <button className="btn btn-primary" onClick={handleUpdateAvatar} disabled={avatarLoading}>
                                        {avatarLoading ? <Loader size="sm" /> : 'Upload Avatar'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Personal Info Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Personal Information</h2>
                <form onSubmit={handleUpdateAccount} className={styles.form}>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Full Name</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={accountData.fullName}
                                onChange={(e) => setAccountData({ ...accountData, fullName: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Email Address</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={accountData.email}
                                onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className={styles.actions}>
                        <button type="submit" className="btn btn-primary" disabled={accountLoading}>
                            {accountLoading ? <Loader size="sm" /> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Security Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Security</h2>
                <form onSubmit={handleChangePassword} className={styles.form}>
                    <div className={styles.field}>
                        <label>Current Password</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={passwordData.oldPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label>New Password</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            required
                        />
                    </div>
                    <div className={styles.actions}>
                        <button type="submit" className="btn btn-secondary" disabled={passwordLoading}>
                            {passwordLoading ? <Loader size="sm" /> : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
