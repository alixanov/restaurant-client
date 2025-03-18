import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { io } from "socket.io-client";
import "./food-modal.css";

const socket = io(`http://localhost:${process.env.PORT || 5000}`, {
     transports: ["websocket"],
     cors: {
          origin: ["http://localhost:3000", "http://localhost:3001"],
          credentials: true,
     },
     autoConnect: true,
});

const FoodModal = ({ isOpen, onClose, table }) => {
     const [foods, setFoods] = useState([]);
     const [categories, setCategories] = useState([]);
     const [selectedCategory, setSelectedCategory] = useState(null);
     const [selectedFoods, setSelectedFoods] = useState([]);
     const [loading, setLoading] = useState(false);
     const [orderComplete, setOrderComplete] = useState(false);
     const [workerName, setWorkerName] = useState("");
     const [workerId, setWorkerId] = useState(null);
     const [activeOrders, setActiveOrders] = useState([]);
     const [isTableLocked, setIsTableLocked] = useState(false);

     const fetchTableData = async (token, currentWorkerId) => {
          try {
               const tableResponse = await axios.get(`http://localhost:5000/api/tables/${table._id}`, {
                    headers: { Authorization: `Bearer ${token}` },
               });
               const tableData = tableResponse.data.innerData;
               setIsTableLocked(
                    tableData.isActive &&
                    tableData.workerId &&
                    tableData.workerId._id?.toString() !== currentWorkerId.toString()
               );

               const ordersResponse = await axios.get(
                    `http://localhost:5000/api/orders/table/${table._id}?workerId=${currentWorkerId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
               );
               setActiveOrders(ordersResponse.data.innerData || []);
          } catch (error) {
               console.error("Ошибка загрузки данных:", error);
          }
     };

     useEffect(() => {
          if (!socket.connected) {
               socket.connect();
          }

          if (isOpen && table) {
               const token = JSON.parse(localStorage.getItem("access_token"));
               if (!token) {
                    console.error("Токен доступа не найден");
                    return;
               }

               let currentWorkerId;
               try {
                    const decodedToken = jwtDecode(token);
                    setWorkerName(decodedToken.login);
                    currentWorkerId = decodedToken.id;
                    setWorkerId(currentWorkerId);
               } catch (error) {
                    console.error("Ошибка декодирования токена:", error);
                    return;
               }

               fetchTableData(token, currentWorkerId);

               axios
                    .get("http://localhost:5000/api/foods/all", {
                         headers: { Authorization: `Bearer ${token}` },
                    })
                    .then((response) => {
                         const allFoods = response.data.innerData;
                         const uniqueCategories = [...new Set(allFoods.map((food) => food.category))];
                         setFoods(allFoods);
                         setCategories(uniqueCategories);
                    })
                    .catch((error) => console.error("Ошибка загрузки блюд:", error));
          }

          const handleConnect = () => console.log("Socket подключён в FoodModal");
          const handleNewOrder = (order) => {
               if (order.table === table?._id) {
                    console.log("Новый заказ принят:", order);
                    setActiveOrders((prev) => [...prev, order]);
               }
          };
          const handleTableStatus = ({ tableId, isActive, workerId: tableWorkerId }) => {
               if (tableId === table?._id) {
                    const workerIdStr = tableWorkerId ? (typeof tableWorkerId === 'object' ? tableWorkerId._id?.toString() : tableWorkerId.toString()) : null;
                    setIsTableLocked(
                         isActive &&
                         workerIdStr &&
                         workerIdStr !== (workerId?.toString() || '')
                    );
                    if (!isActive) {
                         setOrderComplete(true);
                         setTimeout(() => {
                              setOrderComplete(false);
                              setSelectedFoods([]);
                              onClose();
                         }, 1500);
                    }
               }
          };
          const handleBillGenerated = (data) => {
               if (data.tableId === table?._id) {
                    console.log("Счёт готов:", data);
                    setLoading(false);
                    setOrderComplete(true);
                    setTimeout(() => {
                         setOrderComplete(false);
                         setSelectedFoods([]);
                         onClose();
                    }, 1500);
               }
          };
          const handleOrderClosed = (order) => {
               if (order.table._id === table?._id) {
                    console.log("Заказ закрыт:", order);
                    setActiveOrders((prev) => prev.filter((o) => o._id !== order._id));
               }
          };
          const handleConnectError = (err) => console.error("Ошибка сокета:", err);

          socket.on("connect", handleConnect);
          socket.on("new_order", handleNewOrder);
          socket.on("table_status", handleTableStatus);
          socket.on("bill_generated", handleBillGenerated);
          socket.on("order_closed", handleOrderClosed);
          socket.on("connect_error", handleConnectError);

          return () => {
               socket.off("connect", handleConnect);
               socket.off("new_order", handleNewOrder);
               socket.off("table_status", handleTableStatus);
               socket.off("bill_generated", handleBillGenerated);
               socket.off("order_closed", handleOrderClosed);
               socket.off("connect_error", handleConnectError);
          };
     }, [isOpen, table, onClose]);

     const handleFoodSelect = (food) => {
          if (isTableLocked) {
               alert("Этот стол заблокирован другим официантом!");
               return;
          }
          const existingFood = selectedFoods.find((f) => f._id === food._id);
          if (existingFood) {
               setSelectedFoods(
                    selectedFoods.map((f) =>
                         f._id === food._id ? { ...f, count: f.count + 1 } : f
                    )
               );
          } else {
               setSelectedFoods([...selectedFoods, { ...food, count: 1 }]);
          }
     };

     const handleFoodDecrease = (food) => {
          if (isTableLocked) {
               alert("Этот стол заблокирован другим официантом!");
               return;
          }
          const existingFood = selectedFoods.find((f) => f._id === food._id);
          if (existingFood.count > 1) {
               setSelectedFoods(
                    selectedFoods.map((f) =>
                         f._id === food._id ? { ...f, count: f.count - 1 } : f
                    )
               );
          } else {
               setSelectedFoods(selectedFoods.filter((f) => f._id !== food._id));
          }
     };

     const handleOrder = () => {
          if (isTableLocked) {
               alert("Этот стол заблокирован другим официантом!");
               return;
          }
          setLoading(true);
          const token = JSON.parse(localStorage.getItem("access_token"));
          if (!token) {
               console.error("Токен доступа не найден");
               setLoading(false);
               return;
          }

          let currentWorkerId;
          try {
               const decodedToken = jwtDecode(token);
               currentWorkerId = decodedToken.id;
               setWorkerId(currentWorkerId);
          } catch (error) {
               console.error("Ошибка декодирования токена:", error);
               setLoading(false);
               return;
          }

          const orderData = {
               tableId: table._id,
               foods: selectedFoods.map((food) => ({ food: food._id, quantity: food.count })),
               workerId: currentWorkerId,
          };

          axios
               .post("http://localhost:5000/api/orders/create", orderData, {
                    headers: { Authorization: `Bearer ${token}` },
               })
               .then((response) => {
                    console.log("Заказ успешно отправлен:", response.data);
                    setLoading(false);
                    setOrderComplete(true);
                    setTimeout(() => {
                         setOrderComplete(false);
                         setSelectedFoods([]);
                    }, 1500);
               })
               .catch((error) => {
                    console.error("Ошибка создания заказа:", error.response?.data || error.message);
                    setLoading(false);
               });
     };

     const handleCloseAllOrders = async () => {
          setLoading(true);
          const token = JSON.parse(localStorage.getItem("access_token"));
          if (!token) {
               console.error("Токен доступа не найден");
               setLoading(false);
               return ;
          }

          let currentWorkerId;
          try {
               const decodedToken = jwtDecode(token);
               currentWorkerId = decodedToken.id;
          } catch (error) {
               console.error("Ошибка декодирования токена:", error);
               setLoading(false);
               return;
          }

          try {
               for (const order of activeOrders) {
                    await axios.post(
                         `http://localhost:5000/api/orders/close/${order._id}`,
                         { workerId: currentWorkerId },
                         { headers: { Authorization: `Bearer ${token}` } }
                    );
                    console.log(`Заказ ${order._id} успешно закрыт`);
               }
               setLoading(false);
               setOrderComplete(true);
               setTimeout(() => {
                    setOrderComplete(false);
                    onClose();
               }, 1500);
          } catch (error) {
               console.error("Ошибка закрытия заказов:", error.response?.data || error.message);
               setLoading(false);
          }
     };

     const aggregateAllOrderItems = () => {
          const allItems = activeOrders.flatMap((order) => order.foods);
          const aggregated = allItems.reduce((acc, item) => {
               const existingItem = acc.find((i) => i.food._id === item.food._id);
               if (existingItem) {
                    existingItem.quantity += item.quantity;
               } else {
                    acc.push({ ...item });
               }
               return acc;
          }, []);
          return aggregated;
     };

     const calculateTotalPrice = () => {
          return activeOrders.reduce((total, order) => total + order.totalPrice, 0);
     };

     if (!isOpen || !table) return null;

     return (
          <div className="food-modal-overlay">
               <div className="food-modal">
                    <div className="food-modal__header">
                         <h2 className="food-modal__title">Стол #{table.number}</h2>
                         <button className="food-modal__close" onClick={onClose}>
                              ×
                         </button>
                    </div>
                    <div className="food-modal__worker-info">
                         <span className="food-modal__worker-name">Имя: {workerName}</span>
                    </div>

                    {activeOrders.length > 0 && (
                         <div className="food-modal__active-orders">
                              <h3 className="food-modal__subtitle">Активные заказы</h3>
                              <div className="food-modal__order">
                                   <div className="food-modal__order-content">
                                        <ul className="food-modal__order-items">
                                             {aggregateAllOrderItems().map((item, index) => (
                                                  <li key={index}>
                                                       {item.food.name} × {item.quantity} —{" "}
                                                       {(item.food.price * item.quantity).toLocaleString()} сум
                                                  </li>
                                             ))}
                                        </ul>
                                        <div className="food-modal__order-footer">
                                             <span className="food-modal__order-total">
                                                  Итого: {calculateTotalPrice().toLocaleString()} сум
                                             </span>
                                             {!isTableLocked && (
                                                  <button
                                                       className="food-modal__bill-btn"
                                                       onClick={handleCloseAllOrders}
                                                       disabled={loading}
                                                  >
                                                       Закрыть
                                                  </button>
                                             )}
                                        </div>
                                   </div>
                              </div>
                         </div>
                    )}

                    {!selectedCategory ? (
                         <div className="food-modal__categories">
                              <div className="food-modal__categories-grid">
                                   {categories.map((category, index) => (
                                        <button
                                             key={index}
                                             className="food-modal__category-btn"
                                             onClick={() => setSelectedCategory(category)}
                                             disabled={isTableLocked}
                                        >
                                             {category}
                                        </button>
                                   ))}
                              </div>
                         </div>
                    ) : (
                         <div className="food-modal__content">
                              <button
                                   className="food-modal__back-btn"
                                   onClick={() => setSelectedCategory(null)}
                              >
                                   ←
                              </button>
                              <h3 className="food-modal__subtitle">{selectedCategory}</h3>
                              <div className="food-modal__grid">
                                   {foods
                                        .filter((food) => food.category === selectedCategory)
                                        .map((food) => {
                                             const isSelected = selectedFoods.find((f) => f._id === food._id);
                                             return (
                                                  <div
                                                       key={food._id}
                                                       className={`food-modal__item ${isSelected ? "active" : ""}`}
                                                       onClick={() => handleFoodSelect(food)}
                                                  >
                                                       <img
                                                            src={food.image}
                                                            alt={food.name}
                                                            className="food-modal__image"
                                                       />
                                                       <span className="food-modal__name">{food.name}</span>
                                                       <span className="food-modal__price">{food.price} сум</span>
                                                       {isSelected && (
                                                            <div className="food-modal__controls">
                                                                 <button
                                                                      className="food-modal__control-btn"
                                                                      onClick={(e) => {
                                                                           e.stopPropagation();
                                                                           handleFoodDecrease(food);
                                                                      }}
                                                                 >
                                                                      −
                                                                 </button>
                                                                 <span className="food-modal__count">{isSelected.count}</span>
                                                                 <button
                                                                      className="food-modal__control-btn"
                                                                      onClick={(e) => {
                                                                           e.stopPropagation();
                                                                           handleFoodSelect(food);
                                                                      }}
                                                                 >
                                                                      +
                                                                 </button>
                                                            </div>
                                                       )}
                                                  </div>
                                             );
                                        })}
                              </div>
                              {selectedFoods.length > 0 && (
                                   <div className="food-modal__footer">
                                        <button
                                             className="food-modal__cancel-btn"
                                             onClick={onClose}
                                             disabled={loading}
                                        >
                                             Отмена
                                        </button>
                                        <button
                                             className="food-modal__order-btn"
                                             onClick={handleOrder}
                                             disabled={loading || isTableLocked}
                                        >
                                             {loading ? (
                                                  <span className="food-modal__loader"></span>
                                             ) : orderComplete ? (
                                                  "Готово"
                                             ) : (
                                                  `Заказать (${selectedFoods.reduce((sum, f) => sum + f.count, 0)})`
                                             )}
                                        </button>
                                   </div>
                              )}
                         </div>
                    )}
               </div>
          </div>
     );
};

export default FoodModal;