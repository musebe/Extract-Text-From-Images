# Extract text from images using tesseract.js, cloudinary and next.js

## Introduction

Efficiency in performing tasks is often defined by how much automation we can achieve. Automation allows us to avoid repetitive tasks which may consume a lot of time. One of the things we can automate is text recognition in images. Optical Character Recognition(OCR) has been around for quite a while. In this tutorial, we'll be leveraging the technology via a Javascript library known as [Tesseract.js](https://github.com/naptha/tesseract.js). This library is a wrapper of the [Tesseract OCR engine](https://github.com/tesseract-ocr/tesseract) which allows us to use it in a Node/Browser environment. We'll be building using [Next.js](https://nextjs.org/) and [Cloudinary](https://cloudinary.com/?ap=em)

## Setup

You will need to be familiar with Javascript for this tutorial. Working knowledge of Node.js and React is also recommended. Install Node.js and NPM on your development machine if you haven't yet. Check out the [official documentation](https://nodejs.org/en/) on how to do this. Also ensure you have a text editor or IDE. 

### Cloudinary Account and Credentials

[Cloudinary](https://cloudinary.com/?ap=em) is an amazing service that provides developers with a suite of APIs for storage, optimization and delivery of different types of media including images and videos. You can easily get started with a free developer account. Create a new account at [cloudinary](https://cloudinary.com/?ap=em) and log in. Head over to the [dashboard](https://cloudinary.com/console?ap=em) where you'll find your API keys and credentials.  Take note of the `Cloud name`, `API Key` and `API Secret` we'll use them later.

![Cloudinary Dashboard](https://github.com/newtonmunene99/extract-text-from-images/blob/master/public/images/cloudinary-dashboard.png "Cloudinary Dashboard")

## Getting started

First things first, let's create a new Next.js project. Run the following command in your terminal.

```bash
npx create-next-app extract-text-from-images
```

The `create-next-app` CLI utility scaffolds a new project called `extract-text-from-images`. You can use any appropriate name for your project. Once the project has been created and the dependencies have been installed, change directory into the new project and open it inside a code editor/IDE.

```bash
cd extract-text-from-images
```

### Dependencies and Libraries

We'll be using the Cloudinary [Node.js SDK](https://npmjs.com/package/cloudinary). Let's install that.

```bash
npm install cloudinary
```

We also need a way to parse form data on the backend so that we can upload images. For this let's install [Formidable](https://npmjs.com/package/formidable).

```bash
npm install formidable
```

Finally, let's install [Tesseract.js](https://npmjs.com/package/tesseract.js)

```bash
npm install tesseract.js
```

One more thing. We'll be using environment variables to store our API Keys securely. Next.js has built in support for environment variables so we don't need to install anything. Read about this [here](https://nextjs.org/docs/basic-features/environment-variables). Create a new file named `.env.local` at the root of your project and paste the following inside.

```env
CLOUD_NAME=YOUR_CLOUD_NAME
API_KEY=YOUR_API_KEY
API_SECRET=YOUR_API_SECRET
```

Remember to replace `YOUR_CLOUD_NAME` `YOUR_API_KEY` and `YOUR_API_SECRET` with the `Cloud name`, `API Key` and `API Secret` values that we got from the [Cloudinary Account and Credentials](#cloudinary-account-and-credentials) section.

### Cloudinary functions

Create a new folder called `lib` at the root of your project then create a new file named `cloudinary.js` inside the `lib` folder. Paste the following code inside `lib/cloudinary.js`

```js
// lib/cloudinary.js

// Import the v2 api and rename it to cloudinary
import { v2 as cloudinary, TransformationOptions } from "cloudinary";

const CLOUDINARY_FOLDER_NAME = "images-with-text/";

// Initialize the sdk with cloud_name, api_key and api_secret
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

/**
 * Gets a resource from cloudinary using it's public id
 *
 * @param {string} publicId The public id of the image
 */
export const handleGetCloudinaryResource = (publicId) => {
  return cloudinary.api.resource(publicId, {
    resource_type: "image",
    type: "upload",
  });
};

/**
 * Get cloudinary uploads
 * @returns {Promise}
 */
export const handleGetCloudinaryUploads = () => {
  return cloudinary.api.resources({
    type: "upload",
    prefix: CLOUDINARY_FOLDER_NAME,
    resource_type: "image",
  });
};

/**
 * Uploads an image to cloudinary and returns the upload result
 *
 * @param {{path: string; transformation?:TransformationOptions,publicId?: string }} resource
 */
export const handleCloudinaryUpload = (resource) => {
  return cloudinary.uploader.upload(resource.path, {
    // Folder to store image in
    folder: CLOUDINARY_FOLDER_NAME,
    // Public id of image.
    public_id: resource.publicId,
    // Type of resource
    resource_type: "auto",
    // Transformation to apply to the video
    transformation: resource.transformation,
  });
};

/**
 * Deletes resources from cloudinary. Takes in an array of public ids
 * @param {string[]} ids
 */
export const handleCloudinaryDelete = (ids) => {
  return cloudinary.api.delete_resources(ids, {
    resource_type: "image",
  });
};

```

At the top we import the cloudinary v2 API and rename it to cloudinary for readability purposes. `CLOUDINARY_FOLDER_NAME` is the cloudinary folder where we'll store all our images. This will allow us to get all of them easily later. 

We then initialize the cloudinary SDK by calling the `config` method on the API and passing the environment variables that we defined in the previous section.

`handleGetCloudinaryResource` gets an uploaded resource using its public ID. It calls the `api.resource` method to get the resource. Read about this [here](https://cloudinary.com/documentation/admin_api#get_the_details_of_a_single_resource)

`handleGetCloudinaryUploads` gets all the images that have been uploaded to the folder that we defined in `CLOUDINARY_FOLDER_NAME`. Read about the `api.resources` method [here](https://cloudinary.com/documentation/admin_api#get_resources)

`handleCloudinaryUpload` uploads an image or video to cloudinary. In our case, it's an image. It calls the `uploaded.upload` method on the API and passes the path to the image we want to upload, as well as some options. Notice how we have specified the folder to be the one we defined earlier in `CLOUDINARY_FOLDER_NAME`. Read about the upload method and it's options [here](https://cloudinary.com/documentation/image_upload_api_reference#upload_method)

`handleCloudinaryDelete` takes in an array of public IDs and passes them to the `api.delete_resources` method which deletes them from cloudinary. Read more about this [here](https://cloudinary.com/documentation/admin_api#delete_resources). Please note that you can also use the [Destroy method](https://cloudinary.com/documentation/image_upload_api_reference#destroy_method) to delete a single resource.

### Parse form function

We'll be using [Formidable](https://npmjs.com/package/formidable) to parse incoming form data. Create a file called `parse-form.js` under the `lib` folder and paste the following inside.

```js
// lib/parse-form.js

import { IncomingForm } from "formidable";

/**
 * Parses the incoming form data.
 *
 * @param {NextApiRequest} req The incoming request object
 */
export const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true, multiples: true });

    form.parse(req, (error, fields, files) => {
      if (error) {
        return reject(error);
      }

      return resolve({ fields, files });
    });
  });
};

```

There's not much here. You can have a look at the [Formidable](https://www.npmjs.com/package/formidable#api) docs to learn more about the options used.

### Images API route

Let's work on the backend. We need to create handlers for the `/api/images` and `/api/images/:id` routes. If you're not familiar with Next.js API Routes, I highly recommend you read the [documentation](https://nextjs.org/docs/api-routes/introduction). This will help you better grasp how API routes work in Next.js. 

Create a new folder called `images` under the `pages/api` folder. Inside `pages/api/images` create a new file named `index.js` and paste the following inside.

```js
// pages/api/index.js

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextApiRequest, NextApiResponse } from "next";
import {
  handleCloudinaryUpload,
  handleGetCloudinaryUploads,
} from "../../../lib/cloudinary";

import { parseForm } from "../../../lib/parse-form";

// Custom config for our API route
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * The handler function for the API route. Takes in an incoming request and outgoing response.
 *
 * @param {NextApiRequest} req The incoming request object
 * @param {NextApiResponse} res The outgoing response object
 */
export default async function handler(req, res) {
  switch (req.method) {
    case "GET": {
      try {
        const result = await handleGetRequest();

        return res.status(200).json({ message: "Success", result });
      } catch (error) {
        return res.status(400).json({ message: "Error", error });
      }
    }

    case "POST": {
      try {
        const result = await handlePostRequest(req);

        return res.status(201).json({ message: "Success", result });
      } catch (error) {
        return res.status(400).json({ message: "Error", error });
      }
    }

    default: {
      return res.status(405).json({ message: "Method not allowed" });
    }
  }
}

const handleGetRequest = async () => {
  const uploads = await handleGetCloudinaryUploads();

  return uploads;
};

/**
 * Handles the POST request to the API route.
 *
 * @param {NextApiRequest} req The incoming request object
 */
const handlePostRequest = async (req) => {
  // Get the form data using the parseForm function
  const data = await parseForm(req);

  // Get the how it started image file from the incoming form data
  const image = data.files.image;

  // Upload the image to Cloudinary
  const imageUploadResult = await handleCloudinaryUpload({
    path: image.path,
  });

  return imageUploadResult;
};
```

At the top we export a [custom config](https://nextjs.org/docs/api-routes/api-middlewares#custom-config) object. This one tells Next.js not to use the default body parser middleware since we want to handle the form data ourselves. 

We then export the handler/controller for our route. Please note that it's a default export. This takes in the incoming request object and the outgoing response object. we use a switch statement to only handle GET and POST requests.

`handleGetRequest` gets all uploads by calling the `handleGetCloudinaryUploads` function that we created earlier. 

`handlePostRequest` gets the incoming form data using the `parseForm` function that we defined. It then uploads the image to cloudinary using the `handleCloudinaryUpload` function and returns the result.

Next, create a file under `pages/api/images` called `[id].js`. This will contain the handler for the `api/images/:id` route. Paste the following inside.

```js
//pages/api/images

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  handleCloudinaryDelete,
  handleGetCloudinaryResource,
} from "../../../lib/cloudinary";
import {
  createWorker,
  createScheduler,
  RecognizeResult,
  setLogging,
} from "tesseract.js";

/**
 * The handler function for the API route. Takes in an incoming request and outgoing response.
 *
 * @param {NextApiRequest} req The incoming request object
 * @param {NextApiResponse} res The outgoing response object
 */
export default async function handler(req, res) {
  const { id } = req.query;

  switch (req.method) {
    case "GET": {
      try {
        if (!id) {
          throw "id param is required";
        }

        const result = await handleGetRequest(id);

        return res.status(200).json({ message: "Success", result });
      } catch (error) {
        console.log(error);

        return res
          .status(error?.error?.http_code ?? 400)
          .json({ message: "Error", error });
      }
    }

    case "DELETE": {
      try {
        const { id } = req.query;

        if (!id) {
          throw "id param is required";
        }

        const result = await handleDeleteRequest(id);

        return res.status(200).json({ message: "Success", result });
      } catch (error) {
        return res.status(400).json({ message: "Error", error });
      }
    }

    default: {
      return res.status(405).json({ message: "Method not allowed" });
    }
  }
}

/**
 * Handles the GET request to the API route.
 *
 * @param {string} id The public id of the image to retrieve
 * @returns
 */
const handleGetRequest = async (id) => {
  // Get the image from cloudinary using the public id
  const resource = await handleGetCloudinaryResource(id.replace(":", "/"));

  // Set Tesseract.js worker verbose logging to true for debugging
  setLogging(true);

  // Create a scheduler
  const scheduler = createScheduler();

  // Create a worker to run the OCR
  const worker1 = createWorker({
    errorHandler: (error) => {
      console.error("Worker 1");
      console.error(error);
      throw error;
    },
  });

  // Create a second worker to run the OCR
  const worker2 = createWorker({
    errorHandler: (error) => {
      console.error("Worker 2");
      console.error(error);
      throw error;
    },
  });

  // Load both workers
  await Promise.all([worker1.load(), worker2.load()]);

  // Load english language data for both workers
  await Promise.all([worker1.loadLanguage("eng"), worker2.loadLanguage("eng")]);

  // Initialize english language data for both workers
  await Promise.all([worker1.initialize("eng"), worker2.initialize("eng")]);

  // Add both workers to the scheduler
  scheduler.addWorker(worker1);
  scheduler.addWorker(worker2);

  /**
   * Use the scheduler to run the OCR on the image.
   * @type {RecognizeResult}
   */
  const result = await scheduler.addJob("recognize", resource.secure_url);

  const { data } = result;

  // Terminate all workers in the scheduler
  await scheduler.terminate();

  // Return the image along with the OCR text
  return { ...resource, text: data.text };
};

/**
 * Deletes a resource from cloudinary
 * @param {string} id
 * @returns
 */
const handleDeleteRequest = async (id) =>
  handleCloudinaryDelete([id.replace(":", "/")]);

```

Most of the handler/controller is similar to what I just explained above.

`handleGetRequest` gets a cloudinary resource using it's public ID by calling the `handleGetCloudinaryResource` function. Note that we replace all colons(:) with a forward slash(/). This is because we switch them up in the frontend as you'll see later. Next we turn on verbose logging for Tesseract.js. This is useful in the development environment for debugging. We then create a scheduler that will allow us to run multiple workers concurrently. Following that is two workers with an error handler. We then proceed to load the workers, load our language and then add the workers to our scheduler. We run the scheduler and await the OCR results. It's important to terminate the scheduler once we're done to avoid it using up resources. Now I'm sure this was quite overwhelming. The best way to understand what each of those lines does is to read the [Tesseract.js docs](https://github.com/naptha/tesseract.js)

`handleDeleteRequest` just calls the `handleCloudinaryDelete` function and passes public IDs of the resources we want to delete.

And we're done with the backend.

### The frontend

For the frontend, we'll have three pages. One for uploading images, another for viewing all uploaded images and another for viewing an image and extracting text.

Create a new folder at the root of your project and name it `components`. Create a new file inside this folder and call it `Layout.js`. Paste the following inside

```jsx
// components/Layout.js

import Head from "next/head";
import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div>
      <Head>
        <title>Extract Text From Images Using Tesseract.js</title>
        <meta
          name="description"
          content="Extract Text From Images Using Tesseract.js"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav>
        <ul>
          <li>
            <Link href="/">
              <a>Home</a>
            </Link>
          </li>
          <li>
            <Link href="/images">
              <a>Images</a>
            </Link>
          </li>
        </ul>
      </nav>
      <main>{children}</main>
      <style jsx>{`
        nav {
          min-height: 100px;
          background-color: #fafafa;
          display: flex;
          align-items: center;
        }

        nav > ul {
          display: flex;
          justify-content: flex-end;
          height: 100%;
          width: 100%;
          padding-right: 50px;
          list-style: none;
        }

        nav > ul > li {
          margin: 0 10px;
        }

        nav > ul > li > a {
          padding: 10px 20px;
          background-color: #7811ff;
          color: #ffffff;
          font-weight: bold;
          border-radius: 5px;
        }

        nav > ul > li > a:hover {
          background-color: #5d1bb4;
        }

        main {
          min-height: calc(100vh - 100px);
        }
      `}</style>
    </div>
  );
}
```

This is just a layout component that we can use to wrap our pages instead of defining it for every page.

Paste the following inside `pages/index.js`

```jsx
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
```

Apart from the `useState` and `useRouter` hooks, the rest is just basic javascript and html. Read about the former from the [React docs](https://reactjs.org/docs/hooks-state.html) and the latter from the [Next.js docs](https://nextjs.org/docs/api-reference/next/router). The `image` state stores the file that is selected from the form input. We also have the `loading` state. `handleFormSubmit` is called when the form is submitted. It makes a POST request to `/api/images` with the form data then navigates to the `/images` page which we're creating next. The rest is just some basic styling for our page.

Create a new folder called `images` under `pages`. Please note that this is not the same as the one we created earlier under `pages/api`. Create a new file called `index.js` under `pages/images` and paste the following inside.

```jsx
// pages/images/index.js

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
```

Here we use the `useCallback` hook to define a memoized callback function. Read more about this hook [here](https://reactjs.org/docs/hooks-reference.html#usecallback). This memoized function makes a GET request to `api/images` and gets all uploaded images then updates the `images` state.

We run the `getImages` function when the component is first rendered using the `useEffect` hook. This hook is usefull when working with side effects. Read about it [here](https://reactjs.org/docs/hooks-effect.html)

`handleDeleteImage` takes in a public id and then makes a DELETE request to `api/images/:id`. For the html we just show all images with a delete button in a flex container. The rest is some simple css styling. Clicking on an image navigates you to the next page. Note that we replace all forward slashes(/) in the public id with colons(:). This is because if we leave the slashes and pass that as the id parameter to the url it will basically be pointing to a non-existent page. Instead of pointing to `images/:id` it will be pointing to `images/:id/:somethingelse/`. We'll replace back the slashes if we need to in the backend.

Let's create the next page now.Create a file called `[id].js` under `pages/images`. Again note that this isn't the same as `pages/api/images`. Paste the following inside `pages/images/[id].js`

```jsx
// pages/images/[id].js

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
```

`getImage` makes a GET call to `api/images/:id`. In the backend, we get the image from cloudinary, run the OCR recognition then return the results along with the extracted text. We did all this in the `pages/api/images/[id].js` file. The rest is just some HTML to show the image and the extracted text under the image and some basic styling. 

### Finishing up

We're almost done. Add the following styles to `styles/globals.css`

```css

a {
  color: #7811ff;
  text-decoration: none;
}

a:hover {
  color: #5d1bb4;
  text-decoration: underline;
}

button {
  padding: 10px 20px;
  background-color: #7811ff;
  color: #ffffff;
  font-weight: bold;
  border: none;
  border-radius: 5px;
}

button:disabled {
  background-color: #cfcfcf;
}

button:hover:not([disabled]) {
  background-color: #5d1bb4;
}

img {
  object-fit: cover;
}
```

We also need to add one more thing. Since we're using the Image component from Next.js, we need to conform to a few practices to ensure that our images are optimized and we get the best performance. Read about this [here](https://nextjs.org/docs/api-reference/next/image#configuration-options). Create a file called `next.config.js` at the root of your project if it doesn't exist and add the following

```js
module.exports = {
  // ... other options
  images: {
    domains: ["res.cloudinary.com"],
  },
};
```

We just added the `res.cloudinary.com` domain to allow the component to load images from cloudinary.

That's about it. You can now run your project in dev mode

```bash
npm run dev
```

> DISCLAIMER: Please note that the Tesseract.js library won't always recognize text from all images so you might run into some errors with some specific images. There's all sorts of open issues on their [Github](https://github.com/naptha/tesseract.js/issues)

You can find the full source code on my [Github](https://github.com/newtonmunene99/extract-text-from-images)