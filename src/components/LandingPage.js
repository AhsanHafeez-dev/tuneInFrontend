'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from './LandingPage.module.css';

export default function LandingPage() {
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        { q: "What is AHtube?", a: "AHtube is a streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries, and more on thousands of internet-connected devices." },
        { q: "How much does AHtube cost?", a: "Watch AHtube on your smartphone, tablet, Smart TV, laptop, or streaming device, all for one fixed monthly fee. Plans range from ₹149 to ₹649 a month. No extra costs, no contracts." },
        { q: "Where can I watch?", a: "Watch anywhere, anytime. Sign in with your AHtube account to watch instantly on the web at ahtube.com from your personal computer or on any internet-connected device that offers the AHtube app, including smart TVs, smartphones, tablets, streaming media players and game consoles." },
        { q: "How do I cancel?", a: "AHtube is flexible. There are no annoying contracts and no commitments. You can easily cancel your account online in two clicks. There are no cancellation fees – start or stop your account anytime." },
        { q: "Is AHtube good for kids?", a: "The AHtube Kids experience is included in your membership to give parents control while kids enjoy family-friendly TV shows and movies in their own space." },
    ];

    return (
        <div className={styles.landingContainer}>
            {/* Hero Section */}
            <div className={styles.hero}>
                <div className={styles.heroBackground} style={{
                    backgroundImage: 'url(/hero-bg.png)'
                }} />
                <div className={styles.heroOverlay}></div>

                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Unlimited movies, TV shows, and more</h1>
                    <p className={styles.heroSubtitle}>Watch anywhere. Cancel anytime.</p>
                    <Link href="/register" className={styles.ctaButton}>
                        Get Started ›
                    </Link>
                </div>
            </div>

            {/* Story Sections */}
            <div className={styles.storySection}>
                {/* Story 1: TV */}
                <div className={styles.storyCard}>
                    <img src="/tv.png" alt="" className={styles.storyBackground} />
                    <div className={styles.storyOverlay}></div>
                    <div className={styles.storyContainer}>
                        <div className={styles.storyText}>
                            <h2 className={styles.storyTitle}>Enjoy on your TV</h2>
                            <p className={styles.storySubtitle}>Watch on Smart TVs, Playstation, Xbox, Chromecast, Apple TV, Blu-ray players, and more.</p>
                        </div>
                    </div>
                </div>

                {/* Story 2: Mobile (Reverse) */}
                <div className={`${styles.storyCard} ${styles.reverse}`}>
                    <img src="/mobile.png" alt="" className={styles.storyBackground} />
                    <div className={styles.storyOverlay}></div>
                    <div className={`${styles.storyContainer} ${styles.reverse}`}>
                        <div className={styles.storyText}>
                            <h2 className={styles.storyTitle}>Download your shows to watch offline</h2>
                            <p className={styles.storySubtitle}>Save your favorites easily and always have something to watch.</p>
                        </div>
                    </div>
                </div>

                {/* Story 3: Everywhere */}
                <div className={styles.storyCard}>
                    <img src="/devices-bg.png" alt="" className={styles.storyBackground} />
                    <div className={styles.storyOverlay}></div>
                    <div className={styles.storyContainer}>
                        <div className={styles.storyText}>
                            <h2 className={styles.storyTitle}>Watch everywhere</h2>
                            <p className={styles.storySubtitle}>Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV.</p>
                        </div>
                    </div>
                </div>

                {/* Story 4: Kids (Reverse) */}
                <div className={`${styles.storyCard} ${styles.reverse}`}>
                    <img src="/kids.png" alt="" className={styles.storyBackground} />
                    <div className={styles.storyOverlay}></div>
                    <div className={`${styles.storyContainer} ${styles.reverse}`}>
                        <div className={styles.storyText}>
                            <h2 className={styles.storyTitle}>Create profiles for kids</h2>
                            <p className={styles.storySubtitle}>Send kids on adventures with their favorite characters in a space made just for them — free with your membership.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className={styles.faqSection}>
                <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
                <div className={styles.faqList}>
                    {faqs.map((faq, index) => (
                        <div key={index} className={styles.faqItem}>
                            <button className={styles.faqQuestion} onClick={() => toggleFaq(index)}>
                                {faq.q}
                                <span>{openFaq === index ? '×' : '+'}</span>
                            </button>
                            <div className={`${styles.faqAnswer} ${openFaq === index ? styles.open : ''}`}>
                                {faq.a}
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.footerCta}>
                    <p className={styles.footerCtaText}>Ready to watch? Enter your email to create or restart your membership.</p>
                    <Link href="/register" className={styles.ctaButton}>
                        Get Started ›
                    </Link>
                </div>
            </div>
        </div>
    );
}
