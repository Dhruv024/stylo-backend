const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
            cb(null, true);
        } else {
            cb(new Error('Sirf JPEG/JPG files allow hain'), false);
        }
    }
});

// CORS - Sirf frontend domains allow karo
app.use(cors({
    origin: [
        'https://stylopro.online',
        'https://www.stylopro.online',
        'http://localhost:3000'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
}));

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

// API key - Environment se lo
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '0cd767aa6fmshd08d25f930a1f1bp1e8607jsn9543f3437c3d';

app.post('/generate-outfit', upload.single('avatar_image'), async (req, res) => {
    try {
        const gender = req.body.gender || 'female';
        const prompt = req.body.prompt || '';
        
        if (!prompt) {
            return res.status(400).send('Prompt nahi hai bhai!');
        }
        
        let finalPrompt = prompt;
        if (gender === 'male') {
            finalPrompt = `man wearing ${finalPrompt}, masculine fit, men's fashion, photorealistic`;
        } else {
            finalPrompt = `woman wearing ${finalPrompt}, feminine fit, women's fashion, photorealistic`;
        }
        
        console.log('📝 Final Prompt:', finalPrompt);
        
        const form = new FormData();
        form.append('avatar_image', fs.createReadStream(req.file.path), {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });
        form.append('clothing_prompt', finalPrompt);
        
        const response = await axios({
            method: 'post',
            url: 'https://try-on-diffusion.p.rapidapi.com/try-on-file',
            data: form,
            headers: {
                ...form.getHeaders(),
                'x-rapidapi-host': 'try-on-diffusion.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY
            },
            responseType: 'arraybuffer',
            timeout: 30000
        });
        
        res.set('Content-Type', 'image/jpeg');
        res.send(response.data);
        fs.unlink(req.file.path, () => {});
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).send(error.response?.data || error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
    console.log(`✅ CORS enabled for stylopro.online`);
});