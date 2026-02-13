'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length > 1) {
                try {
                    const res = await fetch(`/api/v1/videos?query=${encodeURIComponent(query)}&limit=5`);
                    const data = await res.json();
                    if (res.ok) {
                        setSuggestions(data.data.docs || []);
                    }
                } catch (e) {
                    console.error(e);
                }
            } else {
                setSuggestions([]);
            }
        }, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSuggestions([]); // close dropdown
        router.push(query ? `/?query=${encodeURIComponent(query)}` : '/');
    };

    const handleSuggestionClick = (title) => {
        setQuery(title);
        setSuggestions([]);
        router.push(`/?query=${encodeURIComponent(title)}`);
    }

    return (
        <nav className={styles.navbar}>
            <div className={styles.left}>
                <Link href="/" className={styles.logo}>
                    <img src="/logo.png" alt="TuneIn Logo" className={styles.logoImage} />
                    TUNEIN
                </Link>
            </div>

            <div className={styles.center}>
                {user && (
                    <div className={styles.searchContainer}>
                        <form onSubmit={handleSearch} className={styles.searchBar}>
                            <input
                                type="text"
                                placeholder="Search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <button type="submit" className={styles.searchBtn}>
                                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" fill="currentColor"><path d="m20.87 20.17-5.59-5.59C16.35 13.35 17 11.75 17 10c0-3.87-3.13-7-7-7s-7 3.13-7 7 3.13 7 7 7c1.75 0 3.35-.65 4.58-1.28l5.59 5.59 1.41-1.41ZM10 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6 6Z"></path></svg>
                            </button>
                        </form>
                        {suggestions.length > 0 && (
                            <div className={styles.suggestionsDropdown}>
                                {suggestions.map(vid => (
                                    <div
                                        key={vid._id}
                                        className={styles.suggestionItem}
                                        onClick={() => handleSuggestionClick(vid.title)}
                                    >
                                        {vid.title}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.right}>
                {user ? (
                    <>
                        {/* Links moved to sidebar */}
                        <button className={styles.avatar} onClick={logout} title="Click to logout">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.fullName} className={styles.avatarImg} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>{user.fullName?.[0]}</div>
                            )}
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="btn btn-ghost">Log in</Link>
                        <Link href="/register" className="btn btn-primary">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
};
export default Navbar;
