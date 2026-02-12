const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const cors = require('cors');

const app = express();
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }
});

// CORS setup
app.use(cors({
    origin: ['https://stylopro.online', 'https://www.stylopro.online', 'http://localhost:3000'],
    methods: ['GET', 'POST']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Generate outfit endpoint
app.post('/generate-outfit', upload.single('avatar_image'), async (req, res) => {
    try {
        const gender = req.body.gender || 'female';
        const prompt = req.body.prompt || '';
        
        if (!prompt) {
            return res.status(400).send('Prompt required');
        }
        
        let finalPrompt = prompt;
        if (gender === 'male') {
            finalPrompt = `man wearing ${finalPrompt}, men's fashion`;
        } else {
            finalPrompt = `woman wearing ${finalPrompt}, women's fashion`;
        }
        
        const form = new FormData();
        form.append('avatar_image', fs.createReadStream(req.file.path), {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });
        form.append('clothing_prompt', finalPrompt);
        
        const response = await axios({
            method: 'post',
            url: 'https://try-on-diffusion.p.rapidapi.com/try-on-file',
            data: form,
            headers: {
                ...form.getHeaders(),
                'x-rapidapi-host': 'try-on-diffusion.p.rapidapi.com',
                'x-rapidapi-key': process.env.RAPIDAPI_KEY || '0cd767aa6fmshd08d25f930a1f1bp1e8607jsn9543f3437c3d'
            },
            responseType: 'arraybuffer'
        });
        
        res.set('Content-Type', 'image/jpeg');
        res.send(response.data);
        fs.unlink(req.file.path, () => {});
        
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});