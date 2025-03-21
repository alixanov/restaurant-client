import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../stol/personal-acc.css';
import { jwtDecode } from 'jwt-decode';
import closeTokenIcon from '../../assets/close-token-icon.png';
import { apiSlice } from "../../context/service/api.service";
import { useDispatch } from "react-redux";

const PersonalAcc = () => {
     const [userData, setUserData] = useState({
          username: '',
          revenue: 0,
          ordersCount: 0,
     });
     const [loading, setLoading] = useState(true);
     const navigate = useNavigate();
     const dispatch = useDispatch();

     const fetchUserData = useCallback(async (token) => {
          try {
               const decodedToken = jwtDecode(token);
               const workerId = decodedToken.id;

               const response = await axios.get('http://192.168.1.7:8080/api/orders/sales-report', {
                    headers: { Authorization: `Bearer ${token}` },
               });

               const { innerData } = response.data;
               const workerData = innerData.workerReport.find(
                    (worker) => worker.workerId === workerId
               ) || { revenue: 0, ordersCount: 0 };

               setUserData({
                    username: decodedToken.login,
                    revenue: workerData.revenue,
                    ordersCount: workerData.ordersCount,
               });
          } catch (error) {
               console.error('Ошибка загрузки данных:', error);
               navigate('/login'); // Перенаправляем на /login вместо /
          } finally {
               setLoading(false);
          }
     }, [navigate]);

     useEffect(() => {
          const token = localStorage.getItem('access_token');
          if (!token) {
               navigate('/login'); // Перенаправляем на /login вместо /
               return;
          }
          fetchUserData(token);
     }, [fetchUserData, navigate]);

     const logout = useCallback(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('role'); // Удаляем роль, чтобы избежать конфликтов
          dispatch(apiSlice.util.resetApiState());
          navigate('/login', { replace: true }); // Перенаправляем на /login
     }, [dispatch, navigate]);

     return (
          <div className="personal-acc-container">
               <header className="personal-acc-header">
                    <Link to="/stol" className="personal-acc-btn personal-acc-btn-home">←</Link>
                    <button onClick={logout} className="personal-acc-btn personal-acc-btn-logout">
                         <span className="personal-acc-btn-text">Выйти</span>
                         <img src={closeTokenIcon} alt="Logout" className="personal-acc-btn-icon" />
                    </button>
               </header>
               <main className="personal-acc-main">
                    <h1 className="personal-acc-title">Личный кабинет</h1>
                    {loading ? (
                         <div className="personal-acc-loader">Загрузка...</div>
                    ) : (
                         <div className="personal-acc-content">
                              <section className="personal-acc-user-info">
                                   <span className="personal-acc-username">{userData.username}</span>
                              </section>
                              <section className="personal-acc-stats">
                                   <div className="personal-acc-card personal-acc-card-revenue">
                                        <span className="personal-acc-label">Выручка</span>
                                        <span className="personal-acc-value">
                                             {userData.revenue.toLocaleString()} сум
                                        </span>
                                   </div>
                                   <div className="personal-acc-card">
                                        <span className="personal-acc-label">Заказы</span>
                                        <span className="personal-acc-value">{userData.ordersCount}</span>
                                   </div>
                              </section>
                         </div>
                    )}
               </main>
          </div>
     );
};

export default PersonalAcc;