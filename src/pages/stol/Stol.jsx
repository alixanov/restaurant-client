import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { jwtDecode } from "jwt-decode";
import './stol.css';
import FoodModal from './FoodModal';
import { Link } from 'react-router-dom';
import personalAccIcon from '../../assets/personal-acc-icon.png';

const socket = io(`http://localhost:${process.env.PORT || 5000}`, {
    transports: ["websocket"],
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"],
        credentials: true,
    },
    autoConnect: true,
});

const Stol = () => {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentWorkerId, setCurrentWorkerId] = useState(null);

    useEffect(() => {
        // Получаем ID текущего официанта из токена
        const token = JSON.parse(localStorage.getItem("access_token"));
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setCurrentWorkerId(decodedToken.id);
            } catch (error) {
                console.error("Ошибка декодирования токена:", error);
            }
        }

        axios
            .get('http://localhost:5000/api/tables/all')
            .then((response) => {
                setTables(response.data.innerData);
            })
            .catch((error) => console.error('Ошибка загрузки столов:', error));

        if (!socket.connected) {
            socket.connect();
        }

        socket.on("connect", () => {
            console.log("Socket подключён в Stol");
        });

        socket.on("table_status", ({ tableId, isActive, workerId }) => {
            console.log(`Получено обновление статуса стола ${tableId}: ${isActive ? "Занят" : "Свободен"}, workerId: ${workerId}`);
            setTables((prevTables) =>
                prevTables.map((table) =>
                    table._id === tableId ? { ...table, isActive, workerId } : table
                )
            );
        });

        return () => {
            socket.off("connect");
            socket.off("table_status");
        };
    }, []);

    const handleTableClick = (table) => {
        if (table.isActive && table.workerId && table.workerId !== currentWorkerId) {
            alert("Этот стол занят другим официантом!");
            return;
        }
        setSelectedTable(table);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedTable(null);
        setIsModalOpen(false);
    };

    return (
        <div className="stol">
            <div className="stol__header___title">
                <h1 className="stol__title">Выбор стола</h1>
                <Link className="stol__worker__btn" to="/personal-acc">
                    <span className="stol__worker__btn-text">Личный кабинет</span>
                    <img
                        src={personalAccIcon}
                        alt="Personal Account"
                        className="stol__worker__btn-icon"
                    />
                </Link>
            </div>
            <div className="stol__grid">
                {tables.map((table) => (
                    <div
                        key={table._id}
                        className={`stol__card ${table.isActive ? 'occupied' : 'free'}`}
                        onClick={() => handleTableClick(table)}
                    >
                        <div className="stol__card-header">
                            <span className="stol__number">Стол {table.number}</span>
                            <span className={`stol__status ${table.isActive ? 'occupied' : 'free'}`}>
                                {table.isActive ? 'Занят' : 'Свободен'}
                            </span>
                        </div>
                        <div className="stol__card-body">
                            <span className="stol__capacity">{table.capacity} мест</span>
                            {table.isActive && table.workerId && table.workerId !== currentWorkerId && (
                                <span className="stol__occupied-by">Другим официантом</span>
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