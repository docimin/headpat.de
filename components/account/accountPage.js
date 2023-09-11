"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AccountPage() {
  const [userData, setUserData] = useState({ enablensfw: false }); // Initialize with an empty object and a default value
  const [userMe, setUserMe] = useState(null);
  const [setNsfw] = useState(false);
  const [setEmailValue] = useState(userMe?.email || "");
  const [setUsernameValue] = useState(userMe?.username || "");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = document.cookie.replace(
          /(?:(?:^|.*;\s*)jwt\s*\=\s*([^;]*).*$)|^.*$/,
          "$1"
        );
        const userResponse = await fetch(
          "https://backend.headpat.de/api/users/me",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const userResponseData = await userResponse.json();
        setUserMe(userResponseData);
        const userId = userResponseData.id;
        const userDataResponse = await fetch(
          `https://backend.headpat.de/api/user-data/${userId}?populate=*`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const userDataResponseData = await userDataResponse.json();
        setUserData(userDataResponseData.data.attributes);
      } catch (error) {
        console.error(error);
      }
    };
    fetchUserData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const userFormData = new FormData();

    if (email.value) {
      userFormData.append("email", email.value);
    }

    if (username_login.value) {
      userFormData.append("username", username_login.value);
    }

    try {
      const token = document.cookie.replace(
        /(?:(?:^|.*;\s*)jwt\s*\=\s*([^;]*).*$)|^.*$/,
        "$1"
      );

      const userResponse = await fetch(
        "https://backend.headpat.de/api/users/me",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const userResponseData = await userResponse.json();
      const userId = userResponseData.id;

      const userResponseUpdate = await fetch(
        `https://backend.headpat.de/api/users/${userId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: userFormData,
        }
      );

      if (userResponseUpdate.status === 200) {
        alert("User data updated successfully");
      } else if (userResponseUpdate.status === 400) {
        alert("Username needs to be at least 3 characters long");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePasswordReset = async (event) => {
    event.preventDefault();

    const currentPassword = event.target.currentpassword.value;
    const newPassword = event.target.newpassword.value;
    const confirmPassword = event.target.confirmpassword.value;

    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match");
      return;
    }

    try {
      const token = document.cookie.replace(
        /(?:(?:^|.*;\s*)jwt\s*\=\s*([^;]*).*$)|^.*$/,
        "$1"
      );

      const response = await fetch(
        "https://backend.headpat.de/api/auth/change-password",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword: currentPassword,
            password: newPassword,
            passwordConfirmation: confirmPassword,
          }),
        }
      );

      if (response.ok) {
        alert("Password reset successful");
      } else {
        alert("Password reset failed");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const secondaryNavigation = [
    { name: "Account", href: "/account", current: true },
    { name: "Frontpage", href: "/account/frontpage", current: false },
    { name: "Socials", href: "/account/socials", current: false },
  ];

  const handleNsfwChange = async (event) => {
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)jwt\s*\=\s*([^;]*).*$)|^.*$/,
      "$1"
    );

    const { checked } = event.target;
    setUserData((prevUserData) => ({
      ...prevUserData,
      enablensfw: checked,
    }));

    const isChecked = event.target.checked;
    setNsfw(isChecked);

    const userResponse = await fetch(
      "https://backend.headpat.de/api/users/me",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const userResponseData = await userResponse.json();
    setUserMe(userResponseData);
    const userId = userResponseData.id;

    try {
      const putResponse = await fetch(
        `https://backend.headpat.de/api/user-data/${userId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              enablensfw: isChecked,
            },
          }),
        }
      );

      if (!putResponse.ok) {
        throw new Error("PUT request failed");
      }
    } catch (error) {
      console.error(error.message);
      if (error.response) {
        const response = await error.response.json();
        //console.log(response);
      }
    }
  };

  return (
    <>
      <header className="border-b border-white/5">
        {/* Secondary navigation */}
        <nav className="flex overflow-x-auto py-4">
          <ul
            role="list"
            className="flex min-w-full flex-none gap-x-6 px-4 text-sm font-semibold leading-6 text-gray-400 sm:px-6 lg:px-8"
          >
            {secondaryNavigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={item.current ? "text-indigo-400" : ""}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <div className="divide-y divide-white/5">
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base font-semibold leading-7 text-white">
              Personal Information
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-400">
              Use a permanent address where you can receive mail.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="md:col-span-2">
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
              <div className="col-span-full">
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
                    placeholder={userMe ? userMe.email : ""}
                    onChange={(e) => setEmailValue(e.target.value)}
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <div className="col-span-full">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium leading-6 text-white"
                >
                  Username
                </label>
                <div className="mt-2">
                  <div className="flex rounded-md bg-white/5 ring-1 ring-inset ring-white/10 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
                    <span className="flex select-none items-center pl-3 text-gray-400 sm:text-sm">
                      https://headpat.de/user/
                    </span>
                    <input
                      type="text"
                      name="username"
                      id="username_login"
                      placeholder={userMe ? userMe.username : ""}
                      onChange={(e) => setUsernameValue(e.target.value)}
                      className="flex-1 border-0 bg-transparent py-1.5 pl-1 text-white focus:ring-0 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex">
              <button
                type="submit"
                className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                Save
              </button>
            </div>
          </form>
        </div>

        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base font-semibold leading-7 text-white">
              Change password
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-400">
              Update your password associated with your account.
            </p>
          </div>

          <form className="md:col-span-2" onSubmit={handlePasswordReset}>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
              <div className="col-span-full">
                <span
                  htmlFor="current-password"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Current password
                </span>
                <input
                  type="password"
                  name="currentpassword" // Updated name
                  id="currentpassword"
                  autoComplete="current-password"
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                />
              </div>
              <div className="col-span-full">
                <span
                  htmlFor="new-password"
                  className="block text-sm font-medium text-white mb-2"
                >
                  New password
                </span>
                <input
                  type="password"
                  name="newpassword" // Updated name
                  id="newpassword"
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                />
              </div>
              <div className="col-span-full">
                <span
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Confirm new password
                </span>
                <input
                  type="password"
                  name="confirmpassword" // Updated name
                  id="confirmpassword"
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                />
              </div>
              <div className="col-span-full">
                <button
                  type="submit"
                  className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base font-semibold leading-7 text-white">
              Enable NSFW
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-400">
              Checking this box will enable NSFW images. 18+ only.
            </p>
            <p className="text-sm leading-6 text-gray-400">
              Anyone under the age of 18 caught viewing NSFW content will be
              suspended.
            </p>
          </div>

          <form className="md:col-span-2">
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
              <div className="col-span-full">
                <input
                  id="nsfwtoggle"
                  aria-describedby="nsfwtoggle"
                  name="nsfwtoggle"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  checked={userData.enablensfw}
                  onChange={handleNsfwChange}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}