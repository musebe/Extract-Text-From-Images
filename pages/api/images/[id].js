// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  handleCloudinaryDelete,
  handleGetCloudinaryResource,
} from '../../../lib/cloudinary';
import {
  createWorker,
  createScheduler,
  RecognizeResult,
  setLogging,
} from 'tesseract.js';

/**
 * The handler function for the API route. Takes in an incoming request and outgoing response.
 *
 * @param {NextApiRequest} req The incoming request object
 * @param {NextApiResponse} res The outgoing response object
 */
export default async function handler(req, res) {
  const { id } = req.query;

  switch (req.method) {
    case 'GET': {
      try {
        if (!id) {
          throw 'id param is required';
        }

        const result = await handleGetRequest(id);

        return res.status(200).json({ message: 'Success', result });
      } catch (error) {
        console.log(error);

        return res
          .status(error?.error?.http_code ?? 400)
          .json({ message: 'Error', error });
      }
    }

    case 'DELETE': {
      try {
        const { id } = req.query;

        if (!id) {
          throw 'id param is required';
        }

        const result = await handleDeleteRequest(id);

        return res.status(200).json({ message: 'Success', result });
      } catch (error) {
        return res.status(400).json({ message: 'Error', error });
      }
    }

    default: {
      return res.status(405).json({ message: 'Method not allowed' });
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
  const resource = await handleGetCloudinaryResource(id.replace(':', '/'));

  // Set Tesseract.js worker verbose logging to true for debugging
  setLogging(true);

  // Create a scheduler
  const scheduler = createScheduler();

  // Create a worker to run the OCR
  const worker1 = createWorker({
    errorHandler: (error) => {
      console.error('Worker 1');
      console.error(error);
      throw error;
    },
  });

  // Create a second worker to run the OCR
  const worker2 = createWorker({
    errorHandler: (error) => {
      console.error('Worker 2');
      console.error(error);
      throw error;
    },
  });

  // Load both workers
  await Promise.all([worker1.load(), worker2.load()]);

  // Load english language data for both workers
  await Promise.all([worker1.loadLanguage('eng'), worker2.loadLanguage('eng')]);

  // Initialize english language data for both workers
  await Promise.all([worker1.initialize('eng'), worker2.initialize('eng')]);

  // Add both workers to the scheduler
  scheduler.addWorker(worker1);
  scheduler.addWorker(worker2);

  /**
   * Use the scheduler to run the OCR on the image.
   * @type {RecognizeResult}
   */
  const result = await scheduler.addJob('recognize', resource.secure_url);

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
  handleCloudinaryDelete([id.replace(':', '/')]);
