const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function addAdmin() {
    const email = 'admin@university.ru';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        const result = await pool.query(
            'INSERT INTO users (email, password, role, full_name) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING *',
            [email, hashedPassword, 'admin', 'Администратор']
        );
        
        if (result.rows.length > 0) {
            console.log('✅ Администратор успешно создан!');
        } else {
            console.log('⚠️ Администратор уже существует');
        }
    } catch (err) {
        console.error('❌ Ошибка:', err.message);
    } finally {
        pool.end();
    }
}

addAdmin();