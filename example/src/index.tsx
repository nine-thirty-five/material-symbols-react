import React from 'react';
import ReactDOM from 'react-dom/client';
import { Person } from '@nine-thirty-five/material-symbols-react/rounded';
import { Home } from '@nine-thirty-five/material-symbols-react/outlined';
import { Folder } from '@nine-thirty-five/material-symbols-react/sharp';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <div>
      <Person height="4rem" width="4rem" fill="red" />
      <Home height="4rem" width="4rem" fill="blue" />
      <Folder height="4rem" width="4rem" fill="yellow" />
    </div>
  </React.StrictMode>
);
