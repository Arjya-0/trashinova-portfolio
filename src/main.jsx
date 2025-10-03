import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import AdminPanel from './components/AdminPanel';
import AdminAuth from './components/AdminAuth';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route 
          path="/admin" 
          element={
            <AdminAuth>
              <AdminPanel />
            </AdminAuth>
          } 
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);