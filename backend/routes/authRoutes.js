const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const jobRoutes = require('./routes/jobRoutes');
const authRoutes = require('./routes/authRoutes'); // <-- Tambahkan ini

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rute API Utama
app.use('/api', jobRoutes);
app.use('/api/auth', authRoutes); // <-- Tambahkan ini (/api/auth/register & /api/auth/login)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BACKEND KERJASANA LIVE ON PORT ${PORT} CONNECTED TO SUPABASE`);
});