const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

const app = express();

// Middleware - penting untuk Vercel
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (untuk frontend)
app.use(express.static(__dirname));

// Multer memory storage (WAJIB untuk Vercel, jangan pakai diskStorage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan!'));
    }
  }
});

// API endpoint untuk upscale
app.post('/api/upscale', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'Tidak ada file yang diupload' 
      });
    }

    console.log('Memproses gambar:', req.file.originalname);

    // Buat form data untuk API external
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Kirim ke API external
    const response = await axios.post(
      'https://api.siputzx.my.id/api/iloveimg/upscale', 
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: 'stream',
        timeout: 45000 // 45 detik timeout
      }
    );

    // Set headers untuk response
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/png');
    res.setHeader('Cache-Control', 'no-cache');

    // Stream hasil ke client
    response.data.pipe(res);

  } catch (error) {
    console.error('Error:', error.message);
    
    let errorMessage = 'Gagal memproses gambar';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'API server tidak dapat diakses';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Timeout: Proses terlalu lama';
    }

    res.status(500).json({ 
      success: false,
      error: errorMessage 
    });
  }
});

// Route untuk frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Export app untuk Vercel
module.exports = app;
