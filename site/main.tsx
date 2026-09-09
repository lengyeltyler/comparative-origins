import React from 'react';
import { createRoot } from 'react-dom/client';
import Explorer from '../app/explorer';
import '../app/globals.css';
const root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <React.StrictMode>
      <Explorer />
    </React.StrictMode>,
  );
