// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextApiRequest, NextApiResponse } from 'next';
import {
  handleCloudinaryUpload,
  handleGetCloudinaryUploads,
} from '../../../lib/cloudinary';

import { parseForm } from '../../../lib/parse-form';

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
    case 'GET': {
      try {
        const result = await handleGetRequest();

        return res.status(200).json({ message: 'Success', result });
      } catch (error) {
        return res.status(400).json({ message: 'Error', error });
      }
    }

    case 'POST': {
      try {
        const result = await handlePostRequest(req);

        return res.status(201).json({ message: 'Success', result });
      } catch (error) {
        return res.status(400).json({ message: 'Error', error });
      }
    }

    default: {
      return res.status(405).json({ message: 'Method not allowed' });
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
