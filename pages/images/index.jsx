import { useCallback, useEffect, useState } from "react";
import Layout from "../../components/Layout";
import Link from "next/link";
import Image from "next/image";

export default function ImagesPage() {
  /**
   * Looading state
   * @type {[boolean, (boolean) => void]}
   */
  const [loading, setLoading] = useState(false);

  /**
   * All uploaded images state
   * @type {[object[], (object[]) => void]}
   */
  const [images, setImages] = useState([]);

  const getImages = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/images", {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data);
      }

      setImages(data.result.resources);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getImages();
  }, [getImages]);

  const handleDeleteImage = async (id) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/images/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data);
      }

      getImages();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {loading ? (
        <div className="loading-wrapper">
          <p>Loading...</p>
        </div>
      ) : (
        <div className="wrapper">
          <p>
            Please note that{" "}
            <a
              href="https://github.com/naptha/tesseract.js/"
              target="_blank"
              rel="noreferrer"
            >
              Tesseract.js
            </a>{" "}
            may have issues recognizing text from certain images. See{" "}
            <a
              href="https://github.com/naptha/tesseract.js/issues"
              target="_blank"
              rel="noreferrer"
            >
              Github Issues
            </a>
          </p>
          {images.length > 0 ? (
            <div className="images-wrapper">
              {images.map((image, index) => (
                <div className="image-wrapper" key={`image-${index}`}>
                  <Link
                    href={`/images/${image.public_id.replace(/\//g, ":")}`}
                    passHref
                  >
                    <div className="image-container">
                      <Image
                        src={image.secure_url}
                        alt={image.public_id}
                        layout="fill"
                      ></Image>
                    </div>
                  </Link>
                  <div className="controls">
                    <a href={image.secure_url} target="_blank" rel="noreferrer">
                      {image.secure_url}
                    </a>
                    <Link
                      href={`/images/${image.public_id.replace(/\//g, ":")}`}
                      passHref
                    >
                      <button>Open</button>
                    </Link>

                    <button
                      onClick={(e) => {
                        e.preventDefault();

                        handleDeleteImage(image.public_id.replace(/\//g, ":"));
                      }}
                    >
                      {" "}
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-images">
              <p>No Images Yet</p>
              <Link href="/">
                <a>Upload Image</a>
              </Link>
            </div>
          )}
        </div>
      )}
      <style jsx>{`
        div.loading-wrapper {
          height: calc(100vh - 100px);
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        div.wrapper {
          height: calc(100vh - 100px);
          width: 100%;
          display: flex;
          flex-flow: column nowrap;
          justify-content: flex-start;
          align-items: center;
        }

        div.wrapper > div.images-wrapper {
          height: 100%;
          width: 100%;
          display: flex;
          flex-flow: row wrap;
          gap: 20px;
          padding: 20px;
        }

        div.wrapper > div.images-wrapper > div.image-wrapper {
          flex: 0 0 400px;
          height: 300px;
          background-color: #fafafa;
          border-radius: 5px;
        }

        div.wrapper
          > div.images-wrapper
          > div.image-wrapper
          > div.image-container {
          position: relative;
          height: 70%;
          background-color: #c29b9b;
        }

        div.wrapper
          > div.images-wrapper
          > div.image-wrapper
          > div.image-container:hover {
          border-bottom: 0 none;
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.46);
          cursor: pointer;
        }

        div.wrapper > div.images-wrapper > div.image-wrapper > div.controls {
          padding: 10px;
        }

        div.wrapper
          > div.images-wrapper
          > div.image-wrapper
          > div.controls
          > a {
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        div.wrapper
          > div.images-wrapper
          > div.image-wrapper
          > div.controls
          > button {
          margin: 10px;
        }

        div.wrapper > div.no-images {
          height: 100%;
          width: 100%;
          display: flex;
          flex-flow: column nowrap;
          justify-content: center;
          align-items: center;
        }

        div.wrapper > div.no-images > a {
          padding: 10px 20px;
          background-color: #7811ff;
          color: #ffffff;
          font-weight: bold;
          border-radius: 5px;
        }

        div.wrapper > div.no-images > a:hover {
          background-color: #5d1bb4;
        }
      `}</style>
    </Layout>
  );
}
