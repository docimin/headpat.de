"use client";
import { useState, useEffect, useRef } from "react";
import ErrorPage from "../../404";
import Link from "next/link";
import Image from "next/image";

export default function FetchGallery() {
  const [gallery, setGallery] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [enableNsfw, setEnableNsfw] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get("page")) || 1;
    setCurrentPage(page);
  }, []);

  useEffect(() => {
    const fetchUserId = async () => {
      const token = document.cookie.replace(
        /(?:(?:^|.*;\s*)jwt\s*\=\s*([^;]*).*$)|^.*$/,
        "$1"
      );
      if (!token || typeof token === "undefined") return; // Return if "jwt" token does not exist

      try {
        const response = await fetch(`/api/user/getUserSelf`, {
          method: "GET",
        });

        const data = await response.json();
        //console.log(data);
        setUserId(data.id);
      } catch (error) {
        setError(error);
      }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    if (!userId) return; // Wait for userId to be available

    const fetchUserData = async () => {
      const token = document.cookie.replace(
        /(?:(?:^|.*;\s*)jwt\s*\=\s*([^;]*).*$)|^.*$/,
        "$1"
      );
      if (!token || typeof token === "undefined") return; // Return if "jwt" token does not exist

      try {
        const response = await fetch(`/api/user/getUserData/${userId}`, {
          method: "GET",
        });

        const data = await response.json();
        setEnableNsfw(data.data.attributes.enablensfw);
      } catch (error) {
        setError(error);
      }
    };

    fetchUserData();
  }, [userId]);

  useEffect(() => {
    if (!userId) return; // Wait for userId to be available

    const filters = !enableNsfw
      ? `filters[users_permissions_user][id][$eq]=${userId}&filters[nsfw][$eq]=false`
      : `filters[users_permissions_user][id][$eq]=${userId}`;

    const pageSize = 25;
    const apiUrl = `/api/gallery/getTotalGallery?populate=*&${filters}&pagination[pageSize]=${pageSize}&pagination[page]=${currentPage}`;

    setIsLoading(true);

    fetch(apiUrl, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        setGallery(data.data.reverse());
        setTotalPages(data.meta.pagination.pageCount);
        setIsLoading(false);
      })
      .catch((error) => {
        setError(error);
        setIsLoading(false);
      });
  }, [userId, enableNsfw, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.history.pushState({ page }, `Page ${page}`, `?page=${page}`);
  };

  return (
    <>
      <div>
        {isLoading ? (
          error ? (
            <p className="text-center text-red-500 font-bold my-8">
              {error.message.includes(
                "Cannot read properties of undefined (reading 'id')"
              ) ? (
                <ErrorPage />
              ) : (
                `Error: ${error.message}`
              )}
            </p>
          ) : (
            <p className="text-center text-gray-500 font-bold my-8">
              Loading...
            </p>
          )
        ) : (
          <>
            <ul
              role="list"
              className="p-8 flex flex-wrap gap-4 justify-center items-center"
            >
              {gallery.map((item) => (
                <div key={item.id}>
                  {item.attributes.img && item.attributes.img.data && (
                    <div
                      className={`rounded-lg overflow-hidden h-64 ${
                        item.attributes.nsfw && !enableNsfw ? "relative" : ""
                      }`}
                    >
                      {item.attributes.nsfw && !enableNsfw && (
                        <div className="absolute inset-0 bg-black opacity-50"></div>
                      )}
                      <Link href={`/account/gallery/${item.id}`}>
                        <Image
                          src={
                            item.attributes.nsfw && !enableNsfw
                              ? "https://placekitten.com/200/300" // Replace with placeholder image URL
                              : item.attributes.img.data.attributes.ext ===
                                ".gif"
                              ? item.attributes.img.data.attributes.url
                              : item.attributes.img.data.attributes.formats
                                  .small
                              ? item.attributes.img.data.attributes.formats
                                  .small.url
                              : item.attributes.img.data.attributes.url
                          }
                          alt={item.attributes.imgalt}
                          className={`object-cover h-full w-full max-h-[600px] max-w-[600px]`}
                          width={600}
                          height={600}
                          loading="lazy" // Add this attribute for lazy loading
                        />
                      </Link>
                    </div>
                  )}
                  <h2>{item.attributes.name}</h2>
                </div>
              ))}
            </ul>
          </>
        )}
      </div>
      {/* Pagination buttons */}
      <div className="flex justify-center items-center my-4">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            className={`mx-2 px-4 py-2 rounded-lg ${
              page === currentPage ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </button>
        ))}
      </div>
    </>
  );
}
