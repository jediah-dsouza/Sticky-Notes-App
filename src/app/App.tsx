import { NotesWorkspace } from '../features/notes/NotesWorkspace';
import { AppHeader } from '../components/layout/AppHeader';
import { NotFoundPage } from '../components/layout/NotFoundPage';
import styles from '../components/layout/Layout.module.css';

export function App() {
  const isWorkspace = window.location.pathname === '/';
  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <AppHeader />
      {isWorkspace ? <NotesWorkspace /> : <NotFoundPage />}
      <footer className={styles.footer}>
        <span>Paper Atelier</span>
        <span>Built with care, one step at a time.</span>
      </footer>
    </div>
  );
}
