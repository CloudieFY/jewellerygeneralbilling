import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import toast from "react-hot-toast";

import API from "../../services/api";

const Register = () => {

  const navigate =
    useNavigate();

  const [formData,
    setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
    });

  const handleChange =
    (e) => {

      setFormData({
        ...formData,
        [e.target.name]:
          e.target.value,
      });
    };

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      try {

        await API.post(
          "/auth/register",
          formData
        );

        toast.success("Registration successful. Please log in.");

        navigate(
          "/login"
        );

      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Registration failed. Please try again."
        );
      }
    };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 px-4 py-10">

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-lg"
      >

        <h1 className="text-3xl font-bold mb-6 text-center">
          Create Account
        </h1>

        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={
            handleChange
          }
          className="w-full border p-3 rounded-lg mb-4"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={
            handleChange
          }
          className="w-full border p-3 rounded-lg mb-4"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={
            handleChange
          }
          className="w-full border p-3 rounded-lg mb-4"
          minLength={6}
          required
        />

        <button className="w-full bg-blue-600 text-white py-3 rounded-lg">
          Register
        </button>

        <p className="mt-4 text-center">

          Already have account?

          <Link
            to="/login"
            className="text-blue-600 ml-2"
          >
            Login
          </Link>

        </p>

      </form>

    </div>
  );
};

export default Register;