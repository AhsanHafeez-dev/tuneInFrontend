'use client';
import { useState } from 'react';
import styles from './ImageSlider.module.css';

export default function ImageSlider({ images }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) return null;

    // images is array of objects { url: string, ... } based on user multimedia request
    // or strings? Let's handle both.
    const getUrl = (img) => img.url || img;

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (images.length === 1) {
        return (
            <div className={styles.sliderContainer}>
                <img src={getUrl(images[0])} alt="slide" className={styles.slideImage} />
            </div>
        );
    }

    return (
        <div className={styles.sliderContainer}>
            <button onClick={prevSlide} className={`${styles.navBtn} ${styles.prevBtn}`}>
                ‹
            </button>

            <div className={styles.slide}>
                <img src={getUrl(images[currentIndex])} alt={`slide ${currentIndex}`} className={styles.slideImage} />
            </div>

            <button onClick={nextSlide} className={`${styles.navBtn} ${styles.nextBtn}`}>
                ›
            </button>

            <div className={styles.dots}>
                {images.map((_, idx) => (
                    <div
                        key={idx}
                        className={`${styles.dot} ${currentIndex === idx ? styles.activeDot : ''}`}
                        onClick={() => setCurrentIndex(idx)}
                    />
                ))}
            </div>
        </div>
    );
}
