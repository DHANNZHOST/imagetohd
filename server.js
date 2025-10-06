const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware untuk Vercel
app.use(express.json());
app.use(express.static(__dirname));

// Multer memory storage (untuk Vercel)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar yang diizinkan!'));
        }
    }
});

// API endpoint
app.post('/api/upscale', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada file yang diupload' });
        }

        const formData = new FormData();
        formData.append('image', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const response = await axios.post('https://api.siputzx.my.id/api/iloveimg/upscale', formData, {
            headers: { ...formData.getHeaders() },
            responseType: 'stream',
            timeout: 30000
        });

        res.setHeader('Content-Type', response.headers['content-type'] || 'image/png');
        response.data.pipe(res);

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Gagal memproses gambar' });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

module.exports = app;
