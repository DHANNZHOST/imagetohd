const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('.'));
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar yang diizinkan!'));
        }
    }
});

// API endpoint untuk upscale image
app.post('/api/upscale', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada file yang diupload' });
        }

        console.log('Processing image:', req.file.filename);

        // Prepare form data untuk API external
        const formData = new FormData();
        formData.append('image', fs.createReadStream(req.file.path));

        // Call external API
        const response = await axios.post('https://api.siputzx.my.id/api/iloveimg/upscale', formData, {
            headers: {
                ...formData.getHeaders(),
            },
            responseType: 'stream'
        });

        // Set response headers
        res.setHeader('Content-Type', response.headers['content-type']);
        res.setHeader('Content-Disposition', 'attachment; filename="hd-image.png"');

        // Stream response ke client
        response.data.pipe(res);

        // Cleanup: hapus file temporary setelah selesai
        response.data.on('end', () => {
            fs.unlinkSync(req.file.path);
        });

    } catch (error) {
        console.error('Error processing image:', error);
        
        // Cleanup file temporary jika error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ 
            error: 'Gagal memproses gambar',
            details: error.message 
        });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Ukuran file terlalu besar. Maksimal 10MB' });
        }
    }
    res.status(500).json({ error: error.message });
});

app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📁 Upload folder: ./uploads/`);
});
