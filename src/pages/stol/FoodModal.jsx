import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { io } from "socket.io-client";
import "./food-modal.css";

// Инициализация сокета вне компонента для немедленного подключения
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

     useEffect(() => {
          if (!socket.connected) {
               socket.connect();
          }

          if (isOpen) {
               axios
                    .get("http://localhost:5000/api/foods/all")
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
               }
          };

          const handleTableStatus = ({ tableId, isActive }) => {
               if (tableId === table?._id) {
                    console.log(`Статус стола #${table.number}: ${isActive ? "Активен" : "Свободен"}`);
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

          const handleConnectError = (err) => console.error("Ошибка сокета:", err);

          socket.on("connect", handleConnect);
          socket.on("new_order", handleNewOrder);
          socket.on("table_status", handleTableStatus);
          socket.on("bill_generated", handleBillGenerated);
          socket.on("connect_error", handleConnectError);

          return () => {
               socket.off("connect", handleConnect);
               socket.off("new_order", handleNewOrder);
               socket.off("table_status", handleTableStatus);
               socket.off("bill_generated", handleBillGenerated);
               socket.off("connect_error", handleConnectError);
          };
     }, [isOpen, table, onClose]);

     const handleFoodSelect = (food) => {
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
          setLoading(true);
          const token = JSON.parse(localStorage.getItem("access_token"));
          if (!token) {
               console.error("Токен доступа не найден");
               setLoading(false);
               return;
          }

          let workerId;
          try {
               const decodedToken = jwtDecode(token);
               workerId = decodedToken.id;
          } catch (error) {
               console.error("Ошибка декодирования токена:", error);
               setLoading(false);
               return;
          }

          const orderData = {
               tableId: table._id,
               foods: selectedFoods.map((food) => ({ food: food._id, quantity: food.count })),
               workerId,
          };

          axios
               .post("http://localhost:5000/api/orders/create", orderData, {
                    headers: {
                         Authorization: `Bearer ${token}`,
                    },
               })
               .then((response) => {
                    console.log("Заказ успешно отправлен:", response.data);
                    setLoading(false);
                    setOrderComplete(true);
                    setTimeout(() => {
                         setOrderComplete(false);
                         setSelectedFoods([]);
                         onClose();
                    }, 1500);
               })
               .catch((error) => {
                    console.error("Ошибка создания заказа:", error.response?.data || error.message);
                    setLoading(false);
               });
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

                    {!selectedCategory ? (
                         <div className="food-modal__categories">
                              <div className="food-modal__categories-grid">
                                   {categories.map((category, index) => (
                                        <button
                                             key={index}
                                             className="food-modal__category-btn"
                                             onClick={() => setSelectedCategory(category)}
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
                                             disabled={loading}
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