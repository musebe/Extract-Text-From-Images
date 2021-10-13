import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Layout from "../../components/Layout";
import Image from "next/image";

export default function ImagePage() {
  // Get the Next.js router
  const router = useRouter();

  // Get the image public id from the URL
  const { id } = router.query;

  /**
   * Looading state
   * @type {[boolean, (boolean) => void]}
   */
  const [loading, setLoading] = useState(false);

  /**
   * Image results
   * @type {[object, (object) => void]}
   */
  const [image, setImage] = useState(null);

  /**
   * Error state
   * @type {[boolean, (boolean) => void]}
   */
  const [error, setError] = useState(false);

  const getImage = useCallback(async () => {
    setLoading(true);
    setError(false);

    if (id) {
      try {
        // Make GET request to the /api/images endpoint to get image
        const response = await fetch(`/api/images/${id}`, {
          method: "GET",
        });

        const data = await response.json();

        // Check if the response is a failure
        if (!response.ok) {
          throw data;
        }

        // Update image state
        setImage(data.result);
      } catch (error) {
        // TODO: Show error message to user
        console.error(error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    getImage();
  }, [getImage]);

  return (
    <Layout>
      <div className="wrapper">
        {loading && (
          <div className="loading">
            <p>Please be patient as we fetch your image</p>
            <p>...</p>
          </div>
        )}
        {error && (
          <div className="error">
            <h2>Error</h2>
            <p>There was an error getting your image</p>
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
            <button
              onClick={() => {
                router.reload();
              }}
            >
              Try Again!
            </button>
          </div>
        )}
        {!error && image && (
          <div className="image-wrapper">
            <div className="image-container">
              <Image
                src={image.secure_url}
                alt={image.public_id}
                layout="fill"
              ></Image>
            </div>
            <div className="text-container">
              <h2>Extracted Text</h2>
              {image.text ? <p>{image.text}</p> : <p>No text detected</p>}
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        div.wrapper {
          height: calc(100vh - 100px);
          width: 100%;
        }

        div.wrapper > div.loading,
        div.wrapper > div.error {
          height: 100%;
          width: 100%;
          display: flex;
          flex-flow: column nowrap;
          justify-content: center;
          align-items: center;
        }

        div.wrapper > div.loading > p,
        div.wrapper > div.error > p {
          font-size: 1.5rem;
          font-weight: bold;
        }

        div.wrapper > div.image-wrapper {
          max-width: 600px;
          margin: 0 auto;
          height: 100%;
          background-color: #fafafa;
        }

        div.wrapper > div.image-wrapper > div.image-container {
          position: relative;
          height: 50%;
        }

        div.wrapper > div.image-wrapper > div.text-container {
          height: 50%;
          overflow-y: auto;
          padding: 20px;
          white-space: pre-wrap;
        }

        div.wrapper button {
          margin-top: 20px;
          padding: 10px 20px;
          background-color: #7811ff;
          color: #ffffff;
          font-weight: bold;
          border: none;
          border-radius: 5px;
        }

        div.wrapper button:disabled {
          background-color: #cfcfcf;
        }

        div.wrapper button:hover:not([disabled]) {
          background-color: #5d1bb4;
        }
      `}</style>
    </Layout>
  );
}
