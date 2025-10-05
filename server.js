const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan!'));
    }
  }
});

// Endpoint untuk meningkatkan kualitas gambar
app.get('/api/enhance', async (req, res) => {
  try {
    const { image, scale = '2' } = req.query;
    
    if (!image) {
      return res.status(400).json({ error: 'Parameter image diperlukan' });
    }

    const apiUrl = `https://api.siputzx.my.id/api/iloveimg/upscale?image=${encodeURIComponent(image)}&scale=${scale}`;
    
    const response = await axios({
      method: 'GET',
      url: apiUrl,
      responseType: 'stream'
    });

    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
    
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: 'Gagal memproses gambar',
      details: error.message 
    });
  }
});

// Endpoint untuk upload ke Catbox melalui backend
app.post('/api/upload-catbox', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diupload' });
    }

    const formData = new FormData();
    formData.append('fileToUpload', fs.createReadStream(req.file.path));
    formData.append('reqtype', 'fileupload');

    const response = await axios.post('https://catbox.moe/user/api.php', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    // Hapus file temporary
    fs.unlinkSync(req.file.path);

    res.json({ 
      success: true, 
      url: response.data,
      message: 'Gambar berhasil diupload ke Catbox' 
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Hapus file temporary jika ada error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Gagal mengupload gambar ke Catbox',
      details: error.message 
    });
  }
});

// Endpoint untuk upload lokal
app.post('/api/upload-local', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diupload' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      url: imageUrl,
      filename: req.file.filename,
      message: 'Gambar berhasil diupload ke server' 
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: 'Gagal mengupload gambar',
      details: error.message 
    });
  }
});

// Endpoint untuk menghapus file lokal
app.delete('/api/upload-local/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'File berhasil dihapus' });
    } else {
      res.status(404).json({ error: 'File tidak ditemukan' });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Gagal menghapus file' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Image Enhancement API'
  });
});

// Buat folder uploads jika belum ada
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  console.log(`Uploads folder: ${path.join(__dirname, 'uploads')}`);
});
