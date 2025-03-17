import React, { memo, useState } from "react";
import "./login.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const Login = memo(() => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const value = Object.fromEntries(new FormData(e.target));

    try {
      const res = await axios.post("http://localhost:5000/api/login", value);
      console.log(res);
      const token = res.data?.innerData.token;
      const role = res.data?.innerData?.worker?.role;
      localStorage.setItem("access_token", JSON.stringify(token));
      localStorage.setItem("role", role);
      setTimeout(() => {
        setIsLoading(false);
        navigate('/', { replace: true }); // Перенаправляем на главную страницу
      }, 1500);
    } catch (error) {
      console.error("API xатosi:", error.response?.data || error.message);
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  };

  return (
    <div className="login">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-header">Admin Panel</div>
        <label>
          <input
            type="text"
            placeholder="Login"
            autoComplete="off"
            name="login"
            required
          />
        </label>
        <label>
          <input
            type="password"
            placeholder="Password"
            name="password"
            required
          />
        </label>
        <label>
          <button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="loader"></span>
            ) : (
              "Kirish"
            )}
          </button>
        </label>
      </form>
    </div>
  );
});