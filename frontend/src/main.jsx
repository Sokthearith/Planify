import React from 'react';
import { createRoot } from 'react-dom/client';

import './styles/styles.css';
import './styles/styles-auth.css';
import './styles/styles-onboarding.css';
import './sounds.jsx';
import App from './app.jsx';

createRoot(document.getElementById('root')).render(
  <App />
);
