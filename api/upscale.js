const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');

const upload = multer();

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse multipart form data
    await new Promise((resolve, reject) => {
      upload.single('image')(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Upload to tmpfiles.org
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const uploadResponse = await axios.post(
      'https://tmpfiles.org/api/v1/upload',
      form,
      {
        headers: form.getHeaders(),
        timeout: 120000
      }
    );

    if (!uploadResponse.data || !uploadResponse.data.data || !uploadResponse.data.data.url) {
      throw new Error('Upload to tmpfiles failed');
    }

    // Extract ID and create download URL
    const url = uploadResponse.data.data.url;
    const idMatch = url.match(/\/(\d+)(?:\/|$)/);
    
    if (!idMatch) {
      throw new Error('Invalid tmpfiles URL format');
    }

    const tmpFilesLink = `https://tmpfiles.org/dl/${idMatch[1]}/${req.file.originalname}`;

    // Upscale image
    const upscaleUrl = `https://api.siputzx.my.id/api/iloveimg/upscale?image=${encodeURIComponent(tmpFilesLink)}&scale=4`;
    
    const upscaleResponse = await axios.get(upscaleUrl, {
      responseType: 'arraybuffer',
      timeout: 120000
    });

    // Send back the HD image
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(Buffer.from(upscaleResponse.data));

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: error.response?.data?.message || error.message || 'Failed to process image' 
    });
  }
};
