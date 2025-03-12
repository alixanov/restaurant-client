import React, { memo, useState, useRef, useCallback } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import './layout.css';
import { FaRegCircleUser } from 'react-icons/fa6';
import { CloseModal } from '../utils/closemodal';
import { apiSlice } from '../context/service/api.service';
import { useDispatch } from 'react-redux';
import { Button } from 'antd';

export const Layout = memo(() => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(localStorage.getItem('role') !== 'seller');
  const menuRef = useRef(null);

  const toggleMenu = useCallback(() => setMenu((prev) => !prev), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    dispatch(apiSlice.util.resetApiState());
    navigate('/login');
  }, [dispatch, navigate]);

  CloseModal({ modalRef: menuRef, onClose: () => setMenu(false) });

  return (
    <main className="main">
      <section className="section">
        <Outlet context={{ handleLogout }} /> {/* Передаём handleLogout через context */}
      </section>
    </main>
  );
});