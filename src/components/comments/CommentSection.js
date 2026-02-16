'use client';
import CommentItem from './CommentItem';
import styles from './CommentSection.module.css';

export default function CommentSection({ comments, entityId, user, onRefresh }) {
    return (
        <div className={styles.tree}>
            {comments?.map(c => (
                <CommentItem
                    key={c.id || c._id}
                    comment={c}
                    entityId={entityId}
                    user={user}
                    onRefresh={onRefresh}
                />
            ))}
        </div>
    );
}
