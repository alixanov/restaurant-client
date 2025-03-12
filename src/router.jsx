import React, { memo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './layout/layout';
import { Login } from './pages/auth/login';
import Stol from './pages/stol/Stol';
import PersonalAcc from './pages/stol/PersonalAcc';
import Kassa from './pages/kassa/Kassa';

export const Routera = memo(() => {
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('access_token');

  return token ? (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={role === 'seller' ? <Kassa /> : <Stol />} />
        <Route path="/stol" element={<Stol />} />
        <Route path="/personal-acc" element={<PersonalAcc />} />
        <Route path="*" element={<h1>Страница не найдена</h1>} />
      </Route>
    </Routes>
  ) : (
    <Login />
  );
});