import Layout from "../components/Layout";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Home() {
  const router = useRouter();

  /**
   * State to hold the how it started image
   * @type {[File,Function]}
   */
  const [image, setImage] = useState(null);

  /**
   * Loading state
   * @type {[boolean,Function]}
   */
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      // Get the form data
      const formData = new FormData(e.target);

      // Post the form data to the /api/images endpoint
      const response = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      // Navigate to the images page
      router.push("/images");
    } catch (error) {
      // TODO: Show error message to user
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="wrapper">
        <h1>
          Extract Text From Images Using{" "}
          <Link href="https://github.com/naptha/tesseract.js">
            <a target="_blank">Tesseract.js</a>
          </Link>
        </h1>
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            {image && (
              <div>
                <Image
                  src={URL.createObjectURL(image)}
                  width={200}
                  height={200}
                  layout="fixed"
                  alt="Selected Image"
                />
              </div>
            )}
            <label htmlFor="image">Click To Select Image</label>
            <input
              type="file"
              multiple={false}
              hidden
              required
              disabled={loading}
              id="image"
              name="image"
              accept=".jpg, .jpeg, .png"
              onChange={(e) => {
                const file = e.target.files[0];

                setImage(file);
              }}
            ></input>
          </div>
          <button type="submit" disabled={!image || loading}>
            Upload
          </button>
        </form>
      </div>
      <style jsx>{`
        div.wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          flex-flow: column nowrap;
          justify-content: flex-start;
          align-items: center;
        }

        div.wrapper > h1 > a {
          color: #7811ff;
        }

        div.wrapper > h1 > a:hover {
          color: #5d1bb4;
          text-decoration: underline;
        }

        div.wrapper > form {
          width: 500px;
          min-height: 300px;
          background-color: #f5f5f5;
          border-radius: 5px;
          padding: 20px;
          display: flex;
          flex-flow: column nowrap;
          justify-content: center;
          align-items: center;
        }

        div.wrapper > form > div.form-group {
          display: flex;
          flex-flow: column nowrap;
          justify-content: center;
          align-items: center;
        }
        div.wrapper > form > div.form-group > label {
          font-size: 1.2rem;
          font-weight: bold;
          background-color: #cfcccc;
          padding: 40px 60px;
          cursor: pointer;
          border-radius: 5px;
          margin: 20px 0;
        }

        div.wrapper > form > div.form-group > label:hover {
          color: #5d1bb4;
        }

        div.wrapper > form > button {
          margin-top: 20px;
          padding: 10px 20px;
          background-color: #7811ff;
          color: #ffffff;
          font-weight: bold;
          border: none;
          border-radius: 5px;
        }

        div.wrapper > form > button:disabled {
          background-color: #cfcfcf;
        }

        div.wrapper > form > button:hover:not([disabled]) {
          background-color: #5d1bb4;
        }
      `}</style>
    </Layout>
  );
}
