const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(__dirname));
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
        fileSize: 10 * 1024 * 1024
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
    let tempFile = null;
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada file yang diupload' });
        }

        tempFile = req.file.path;
        console.log('Processing image:', req.file.filename);

        const formData = new FormData();
        formData.append('image', fs.createReadStream(tempFile));

        const response = await axios.post('https://api.siputzx.my.id/api/iloveimg/upscale', formData, {
            headers: {
                ...formData.getHeaders(),
            },
            responseType: 'stream',
            timeout: 30000,
            maxContentLength: 50 * 1024 * 1024,
        });

        res.setHeader('Content-Type', response.headers['content-type'] || 'image/png');
        res.setHeader('Content-Disposition', 'inline; filename="hd-image.png"');

        response.data.pipe(res);

        response.data.on('end', () => {
            if (tempFile && fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        });

        response.data.on('error', (error) => {
            console.error('Stream error:', error);
            if (tempFile && fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        });

    } catch (error) {
        console.error('Error processing image:', error);
        
        if (tempFile && fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }

        let errorMessage = 'Gagal memproses gambar';
        if (error.code === 'ECONNREFUSED') {
            errorMessage = 'API server tidak dapat diakses';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Timeout: Proses terlalu lama';
        } else if (error.response) {
            errorMessage = `API error: ${error.response.status}`;
        }

        res.status(500).json({ 
            success: false,
            error: errorMessage
        });
    }
});

// Serve favicon
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false,
                error: 'Ukuran file terlalu besar. Maksimal 10MB' 
            });
        }
    }
    
    res.status(500).json({ 
        success: false,
        error: error.message 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📁 Upload folder: ./uploads/`);
});
