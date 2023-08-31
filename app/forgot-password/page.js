"use client";
import React, { useState } from "react";
import Header from "@/components/header";
import { useEffect } from "react";
import Link from "next/link";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(";").shift();
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "https://backend.headpat.de/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
          }),
        }
      );
      //console.log("User authenticated successfully");
      if (response.status === 400) {
        setError(
          `E-Mail inkorrekt!`
        );
        setTimeout(() => {
          setError("");
        }, 5000);
      } else if (response.status === 429) {
        setError("Too many requests!");
        setTimeout(() => {
          setError("");
        }, 5000);
      } else if (response.status === 500) {
        setError("Server error!");
        setTimeout(() => {
          setError("");
        }, 5000);
      } else if (response.status === 200) {
        setError("E-Mail sent!");
        setTimeout(() => {
          window.location.href = "/login";
        }, 10000);
      }
    } catch (error) {
      //console.log(error);
      setError("E-Mail inkorrekt!");
    }
  };

  return (
    <>
      <Header />
      <div className="flex lg:pt-[200px] justify-center items-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm flex flex-col justify-center">
          <img
            className="mx-auto h-24 w-auto"
            src="/logo-512.png"
            alt="Headpat Logo"
          />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-white">
            Forgot password?
          </h2>

          {error && (
            <div className="text-red-500 text-center mt-2">{error}</div>
          )}

          <form className="mt-10 space-y-6" action="#" method="POST">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-white"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                onClick={handleSubmit}
              >
                Send E-Mail
              </button>
            </div>
            <div>
              <Link
                href="/login"
                type="submit"
                className="flex w-full justify-center rounded-md bg-red-800 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                &larr; Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;