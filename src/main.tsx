import { createRoot } from 'react-dom/client';
import { App } from './App';
import documentStyles from './Document.module.css';

document.documentElement.classList.add(documentStyles.document);

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
