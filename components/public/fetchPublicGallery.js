import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export default function FetchGallery() {
  const [gallery, setGallery] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [enableNsfw, setEnableNsfw] = useState(false);
  const galleryContainerRef = useRef(null);
  const [visibleGallery, setVisibleGallery] = useState([]);
  const [loadMore, setLoadMore] = useState(true);
  const [loadedImageCount, setLoadedImageCount] = useState(0);

  useEffect(() => {
    const userApiUrl = `https://backend.headpat.de/api/users/me`;

    const fetchUserId = async () => {
      const token = document.cookie.replace(
        /(?:(?:^|.*;\s*)jwt\s*\=\s*([^;]*).*$)|^.*$/,
        "$1"
      );
      if (!token) return; // Return if "jwt" token does not exist

      try {
        const response = await fetch(userApiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setUserId(data.id);
      } catch (error) {
        setError(error);
      }
    };

    fetchUserId();
  }, []);

  const handleImageLoad = () => {
    setLoadedImageCount((prevCount) => prevCount + 1);
  };

  useEffect(() => {
    if (!userId) return; // Wait for userId to be available

    const userDataApiUrl = `https://backend.headpat.de/api/user-data/${userId}`;

    const fetchUserData = async () => {
      const token = document.cookie.replace(
        /(?:(?:^|.*;\s*)jwt\s*\=\s*([^;]*).*$)|^.*$/,
        "$1"
      );
      if (!token) return; // Return if "jwt" token does not exist

      try {
        const response = await fetch(userDataApiUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
    const filters = !enableNsfw ? `filters[nsfw][$eq]=false` : ``;
    const apiUrl = `https://backend.headpat.de/api/galleries?populate=*&${filters}&randomSort=true`;

    setIsLoading(true);
    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        setGallery(data.data.reverse());
        setIsLoading(false);
      })
      .catch((error) => {
        setError(error);
        setIsLoading(false);
      });
  }, [userId, enableNsfw]);

  useEffect(() => {
    // Calculate the initial number of images to display
    const initialVisibleImages = 6; // Adjust this value as needed

    // Slice the gallery array to get the initial set of visible images
    const initialVisibleGallery = gallery.slice(0, initialVisibleImages);

    // Update the state with the initial set of visible images
    setVisibleGallery(initialVisibleGallery);
  }, [gallery]);

  useEffect(() => {
    const handleLoadMore = () => {
      // Calculate the number of additional images to load
      const loadIncrement = 12; // You can adjust this value as needed

      // Calculate the new end index for the visibleGallery
      const newEndIndex = visibleGallery.length + loadIncrement;

      // Slice the gallery array to get the new set of visible images
      const newVisibleGallery = gallery.slice(0, newEndIndex);

      // Update the state with the new set of visible images
      setVisibleGallery(newVisibleGallery);

      // Check if all images have been loaded
      if (newEndIndex >= gallery.length) {
        setLoadMore(false); // Disable further loading
      }
    };

    const handleScroll = () => {
      const container = galleryContainerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const loadThreshold = 200; // Adjust this threshold as needed
      if (containerRect.bottom - window.innerHeight < loadThreshold) {
        // User has scrolled to the bottom, load more images
        handleLoadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [gallery, visibleGallery]);

  return (
    <div ref={galleryContainerRef}>
      {isLoading ? (
        error ? (
          <p className="text-center text-red-500 font-bold my-8">
            Error: {error && error.message}
          </p>
        ) : (
          <p className="text-center text-gray-500 font-bold my-8">Loading...</p>
        )
      ) : (
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
                  <Link href={`/gallery/${item.id}`}>
                    <img
                      src={
                        item.attributes.nsfw && !enableNsfw
                          ? "https://placekitten.com/200/300" // Replace with placeholder image URL
                          : item.attributes.img.data.attributes.ext === ".gif"
                          ? item.attributes.img.data.attributes.url
                          : item.attributes.img.data.attributes.formats.small
                          ? item.attributes.img.data.attributes.formats.small
                              .url
                          : item.attributes.img.data.attributes.url
                      }
                      alt={item.attributes.imgalt}
                      className={`object-cover h-full w-full max-h-[600px] max-w-[600px]`}
                      onLoad={() => handleImageLoad()}
                    />
                  </Link>
                </div>
              )}
              <h2>{item.attributes.name}</h2>
            </div>
          ))}
        </ul>
      )}
    </div>
  );
}
