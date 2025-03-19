import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import "./stol.css";
import FoodModal from "./FoodModal";
import { Link } from "react-router-dom";
import personalAccIcon from "../../assets/personal-acc-icon.png";

// Исправляем URL для Socket.io (порт указываем явно или через переменную окружения)
const socket = io(`http://192.168.1.3:8080`, {
    transports: ["websocket"],
    cors: {
        origin: "http://localhost:3000", // Убрали лишний слэш
        credentials: true,
    },
    autoConnect: true,
});
const Stol = () => {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentWorkerId, setCurrentWorkerId] = useState(null);

    // Функция для загрузки столов
    const fetchTables = async () => {
        try {
            const response = await axios.get("http://192.168.1.3:8080/api/tables/all");
            setTables(response.data.innerData);
        } catch (error) {
            console.error("Ошибка загрузки столов:", error);
        }
    };

    useEffect(() => {
        const token = JSON.parse(localStorage.getItem("access_token"));
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setCurrentWorkerId(decodedToken.id);
            } catch (error) {
                console.error("Ошибка декодирования токена:", error);
            }
        }

        // Загружаем столы при монтировании компонента
        fetchTables();

        if (!socket.connected) {
            socket.connect();
        }

        socket.on("connect", () => {
            console.log("Socket подключён в Stol");
        });

        socket.on("connect_error", (err) => {
            console.error("Ошибка подключения Socket.io:", err.message);
        });

        socket.on("table_status", ({ tableId, isActive, workerId }) => {
            console.log(
                `Получено обновление статуса стола ${tableId}: ${isActive ? "Занят" : "Свободен"
                }, workerId: ${workerId}`
            );
            setTables((prevTables) =>
                prevTables.map((table) =>
                    table._id === tableId
                        ? {
                            ...table,
                            isActive,
                            workerId: workerId
                                ? typeof workerId === "object"
                                    ? workerId
                                    : { _id: workerId }
                                : null,
                        }
                        : table
                )
            );
        });

        return () => {
            socket.off("connect");
            socket.off("connect_error");
            socket.off("table_status");
        };
    }, []);

    const handleTableClick = async (table) => {
        const token = JSON.parse(localStorage.getItem("access_token"));
        if (!token) {
            console.error("Токен доступа не найден");
            return;
        }

        try {
            const response = await axios.get(`http://192.168.1.3:8080/api/tables/${table._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const tableData = response.data.innerData;

            if (tableData.isActive && tableData.workerId && tableData.workerId._id !== currentWorkerId) {
                alert("Этот стол уже занят другим официантом!");
                return;
            }

            setSelectedTable(tableData);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Ошибка проверки статуса стола:", error);
            alert("Не удалось проверить статус стола. Попробуйте снова.");
        }
    };

    const closeModal = () => {
        setSelectedTable(null);
        setIsModalOpen(false);
        // Обновляем данные о столах после закрытия модального окна
        fetchTables();
    };

    return (
        <div className="stol">
            <header className="stol__header">
                <h1 className="stol__title">Выбор стола</h1>
                <Link className="stol__worker-btn" to="/personal-acc">
                    <img
                        src={personalAccIcon}
                        alt="Personal Account"
                        className="stol__worker-icon"
                    />
                    <span className="stol__worker-text">Личный кабинет</span>
                </Link>
            </header>
            <div className="stol__grid">
                {tables.map((table) => (
                    <div
                        key={table._id}
                        className={`stol__card 
              ${!table.isActive ? "free" : table.workerId?._id === currentWorkerId ? "mine" : "occupied"} 
              ${table.isActive && table.workerId && table.workerId._id !== currentWorkerId ? "locked" : ""}`}
                        onClick={() => handleTableClick(table)}
                    >
                        <div className="stol__card-header">
                            <span className="stol__number">Стол {table.number}</span>
                            <span className="stol__status">
                                {!table.isActive
                                    ? "Свободен"
                                    : table.workerId?._id === currentWorkerId
                                        ? "Мой"
                                        : "Занят"}
                            </span>
                        </div>
                        <div className="stol__card-body">
                            <span className="stol__capacity">{table.capacity} мест</span>
                            {table.isActive && table.workerId && table.workerId._id !== currentWorkerId && (
                                <span className="stol__occupied-by">Заблокировано другим</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && (
                <FoodModal isOpen={isModalOpen} onClose={closeModal} table={selectedTable} />
            )}
        </div>
    );
};

export default Stol;