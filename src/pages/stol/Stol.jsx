import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './stol.css';
import FoodModal from './FoodModal';
import { Link } from 'react-router-dom';
import personalAccIcon from '../../assets/personal-acc-icon.png'; // Импорт иконки

const Stol = () => {
     const [tables, setTables] = useState([]);
     const [selectedTable, setSelectedTable] = useState(null);
     const [isModalOpen, setIsModalOpen] = useState(false);

     useEffect(() => {
          axios
               .get('http://localhost:5000/api/tables/all')
               .then((response) => {
                    setTables(response.data.innerData);
               })
               .catch((error) => console.error('Error fetching tables:', error));
     }, []);

     const handleTableClick = (table) => {
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