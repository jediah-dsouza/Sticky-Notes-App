import styles from './Layout.module.css';

export function NotFoundPage() {
  return (
    <main id="main-content" tabIndex={-1} className={styles.main}>
      <div className={styles.introduction}>
        <p className={styles.eyebrow}>Page not found</p>
        <h1>This page is a loose leaf.</h1>
        <p className={styles.lead}>
          There is no workspace at this address. Let's get you back.
        </p>
        <a href="/" className={styles.returnLink}>
          Return to workspace <span aria-hidden="true">↗</span>
        </a>
      </div>
    </main>
  );
}
