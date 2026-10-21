import styles from './Layout.module.css';

export function AppHeader() {
  return (
    <header className={styles.header}>
      <a href="/" className={styles.identity}>
        Sticky Notes App
        <span className={styles.identityMark} aria-hidden="true">
          .
        </span>
      </a>
      <span className={styles.headerNote}>A place to remember</span>
    </header>
  );
}
