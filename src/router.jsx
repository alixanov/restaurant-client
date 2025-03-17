import React, { memo, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Layout } from './layout/layout';
import { Login } from './pages/auth/login';
import Stol from './pages/stol/Stol';
import PersonalAcc from './pages/stol/PersonalAcc';
import Kassa from './pages/kassa/Kassa';

export const Routera = memo(() => {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  return (
    <Routes>
      {token ? (
        <Route path="/" element={<Layout />}>
          <Route index element={role === 'seller' ? <Kassa /> : <Stol />} />
          <Route path="/stol" element={<Stol />} />
          <Route path="/personal-acc" element={<PersonalAcc />} />
          <Route path="*" element={<h1>Страница не найдена</h1>} />
        </Route>
      ) : (
        <Route path="*" element={<Login />} />
      )}
    </Routes>
  );
});