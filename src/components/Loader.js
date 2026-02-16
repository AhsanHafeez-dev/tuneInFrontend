import styles from './Loader.module.css';

export default function Loader({ size = 'md', className = '' }) {
    return (
        <div className={`${styles.loaderContainer} ${className}`}>
            <div className={`${styles.spinner} ${styles[size]}`}></div>
        </div>
    );
}
