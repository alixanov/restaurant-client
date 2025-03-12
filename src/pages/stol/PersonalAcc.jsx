import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // Добавлен useNavigate для перенаправления
import '../stol/personal-acc.css';
import { jwtDecode } from 'jwt-decode';
import closeTokenIcon from '../../assets/close-token-icon.png';
import { apiSlice } from "../../context/service/api.service";
import { useDispatch } from "react-redux";

const PersonalAcc = () => {
     const [salesData, setSalesData] = useState({
          totalSales: 0,
          orderCount: 0,
     });
     const [orders, setOrders] = useState([]);
     const [loading, setLoading] = useState(true);
     const navigate = useNavigate(); // Для перенаправления
     const dispatch = useDispatch();
     

     useEffect(() => {
          const token = JSON.parse(localStorage.getItem('access_token'));
          if (!token) {
               console.error('Access token не найден');
               setLoading(false);
               return;
          }

          let workerId;
          try {
               const decodedToken = jwtDecode(token);
               workerId = decodedToken.id;
          } catch (error) {
               console.error('Ошибка декодирования токена:', error);
               setLoading(false);
               return;
          }

          Promise.all([
               axios.get('https://restaurant-server-xd9o.vercel.app/api/orders/sales'),
               axios.get(`https://restaurant-server-xd9o.vercel.app/api/orders/worker/${workerId}`),
          ])
               .then(([salesResponse, ordersResponse]) => {
                    const { totalSales, orderCount } = salesResponse.data;
                    setSalesData({ totalSales, orderCount });
                    setOrders(ordersResponse.data.innerData || []);
                    setLoading(false);
               })
               .catch((error) => {
                    console.error('Ошибка загрузки данных:', error);
                    setLoading(false);
               });
     }, []);

       const logout = useCallback(() => {
         localStorage.clear();
         dispatch(apiSlice.util.resetApiState());
         window.location.reload();
       }, [dispatch, navigate]);



     return (
          <div className="personal__acc__container">
               <Link className="personal__acc__btn__home" to="/stol">
                    ←
               </Link>

               <Link className="personal__acc__btn__close"  onClick={logout}>
                    <span className="personal__acc__btn__close-text">Выйти</span>
                    <img
                         src={closeTokenIcon}
                         alt="Logout"
                         className="personal__acc__btn__close-icon"
                    />
               </Link>
               <p></p>

               <h1 className="personal__acc__title">Личный кабинет</h1>
               <div className="personal__acc__content">
                    {loading ? (
                         <div className="personal__acc__loader">Загрузка...</div>
                    ) : (
                         <>
                              <div className="personal__acc__stats">
                                   <div className="personal__acc__card personal__acc__card--revenue">
                                        <span className="personal__acc__label">Общая выручка</span>
                                        <span className="personal__acc__value">
                                             {salesData.totalSales.toLocaleString()} сум
                                        </span>
                                   </div>
                                   <div className="personal__acc__card">
                                        <span className="personal__acc__label">Количество заказов</span>
                                        <span className="personal__acc__value">{salesData.orderCount}</span>
                                   </div>
                              </div>
                              <div className="personal__acc__orders">
                                   <h2 className="personal__acc__orders-title">Ваши заказы</h2>
                                   {orders.length > 0 ? (
                                        orders.map((order) => (
                                             <div key={order._id} className="personal__acc__order-card">
                                                  <span className="personal__acc__order-table">
                                                       Стол #{order.tableNumber}
                                                  </span>
                                                  <ul className="personal__acc__order-items">
                                                       {order.foods.map((item, index) => (
                                                            <li key={index} className="personal__acc__order-item">
                                                                 {item.food.name} x{item.quantity} -{' '}
                                                                 {(item.food.price * item.quantity).toLocaleString()} сум
                                                            </li>
                                                       ))}
                                                  </ul>
                                             </div>
                                        ))
                                   ) : (
                                        <p className="personal__acc__no-orders">Нет активных заказов</p>
                                   )}
                              </div>
                         </>
                    )}
               </div>
          </div>
     );
};

export default PersonalAcc;