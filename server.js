const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { pool, testConnection } = require('./init_db');
const Auth = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

const REQUEST_STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled'];

function normalizeDateRange(from, to) {
    if (from && to && from > to) {
        return { from: to, to: from };
    }
    return { from, to };
}

// Фильтры для админских списков: ?from= &to= &status= &teacher=
function buildAdminListFilters(query, tableAlias = 'r') {
    const { status, teacher } = query;
    const { from, to } = normalizeDateRange(query.from, query.to);
    const conditions = [];
    const params = [];

    if (from) {
        params.push(from);
        conditions.push(`${tableAlias}.request_date >= $${params.length}`);
    }
    if (to) {
        params.push(to);
        conditions.push(`${tableAlias}.request_date <= $${params.length}`);
    }
    if (status) {
        if (!REQUEST_STATUSES.includes(status)) {
            return { error: `Недопустимый статус. Допустимые: ${REQUEST_STATUSES.join(', ')}` };
        }
        params.push(status);
        conditions.push(`${tableAlias}.status = $${params.length}`);
    }
    if (teacher) {
        const name = String(teacher).trim();
        if (name) {
            params.push(`%${name}%`);
            const i = params.length;
            conditions.push(
                `(${tableAlias}.teacher_name ILIKE $${i} OR ${tableAlias}.replacing_teacher ILIKE $${i})`
            );
        }
    }

    return { conditions, params };
}

// ================================================
// КОНФИГУРАЦИЯ
// ================================================

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// ================================================
// API МАРШРУТЫ
// ================================================

// Проверка здоровья сервера

app.get('/api/test', (req, res) => {
    res.json({ message: 'Test route works!' });
});

app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = await testConnection();
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: dbStatus ? 'connected' : 'disconnected',
            message: 'Сервер работает корректно!',
            version: '1.0.0'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Тестовый маршрут для расписания (без авторизации)
app.get('/api/test-schedule', async (req, res) => {
    try {
        const { date } = req.query;
        
        const testData = {
            success: true,
            teacher: "Милехина",
            date: date || "2025-12-15",
            schedule: [
                {
                    id: 1,
                    subject: "Линал",
                    classes: 1,
                    dinner: null,
                    team: "ФН11-33Б",
                    date: date || "2025-12-15",
                    day_of_week: 1,
                    week_num: 16,
                    num_den: "num",
                    num_den_text: "числитель",
                    is_replacement: false,
                    can_request_replacement: true
                },
                {
                    id: 2,
                    subject: "Матан",
                    classes: 2,
                    dinner: null,
                    team: "ФН11-33Б",
                    date: date || "2025-12-15",
                    day_of_week: 1,
                    week_num: 16,
                    num_den: "num",
                    num_den_text: "числитель",
                    is_replacement: false,
                    can_request_replacement: true
                }
            ]
        };
        
        res.json(testData);
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Вход в систему
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Запрос на вход:', { email, password: '***' });
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email и пароль обязательны'
            });
        }
        
        const result = await Auth.login(email, password);
        
        console.log('Результат входа:', result.success ? 'Успешно' : 'Ошибка');
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(401).json(result);
        }
    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при входе в систему: ' + error.message
        });
    }
});

// Получение расписания преподавателя
app.get('/api/schedule', Auth.authenticateToken, async (req, res) => {
    try {
        console.log('🎯 /api/schedule запрос получен от:', req.user.email);
        
        const { date } = req.query;
        const userEmail = req.user.email;
        const teacherName = req.user.teacher_name;
        
        console.log('👤 Данные пользователя:', {
            email: req.user.email,
            teacher_name: teacherName,
            role: req.user.role
        });
        
        if (!teacherName) {
            return res.status(400).json({
                success: false,
                message: 'Пользователь не связан с преподавателем'
            });
        }
        
        console.log('👨‍🏫 Преподаватель:', teacherName);
        
        // Используем дату из запроса или первую доступную
        let queryDate = date;
        if (!queryDate) {
            // Если дата не указана, ищем первую доступную дату для этого преподавателя
            const firstDateResult = await pool.query(
                `SELECT MIN(date) as first_date FROM timetable WHERE teacher = $1`,
                [teacherName]
            );
            queryDate = firstDateResult.rows[0]?.first_date || '2025-12-15';
        }
        
        console.log('📅 Ищем расписание на дату:', queryDate);
        
        // Ищем ТОЛЬКО НЕЗАМЕНЕННЫЕ занятия (is_replacement = false)
        // Или занятия где этот преподаватель заменяет кого-то (включаем замены)
        const scheduleData = await pool.query(
            `SELECT 
                t.id,
                t.subject,
                t.classes,
                t.dinner,
                t.team,
                t.date,
                EXTRACT(DOW FROM t.date) as day_of_week,
                t.week_num,
                t.num_den,
                t.is_replacement,
                CASE t.num_den
                    WHEN 'num' THEN 'числитель'
                    WHEN 'den' THEN 'знаменатель'
                END as num_den_text
            FROM timetable t
            WHERE t.teacher = $1 
            AND t.date = $2
            AND (
                t.is_replacement = false 
                OR 
                (t.is_replacement = true AND t.teacher = $1)
            )
            ORDER BY t.classes`,
            [teacherName, queryDate]
        );
        
        console.log('📊 Найдено занятий:', scheduleData.rows.length);
        
        // Добавляем флаг для замены (можно заменить только незамененные занятия)
        const scheduleWithFlags = scheduleData.rows.map(lesson => ({
            ...lesson,
            can_request_replacement: !lesson.is_replacement // Можно заменить если не замена
        }));
        
        res.json({
            success: true,
            teacher: teacherName,
            date: queryDate,
            schedule: scheduleWithFlags
        });
        
    } catch (error) {
        console.error('💥 Ошибка в /api/schedule:');
        console.error('💥 Сообщение:', error.message);
        console.error('💥 Stack trace:', error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера: ' + error.message
        });
    }
});

// История замен для преподавателя
app.get('/api/schedule/replacements', Auth.authenticateToken, async (req, res) => {
    try {
        const teacherName = req.user.teacher_name;
        const { date } = req.query;
        
        if (!teacherName) {
            return res.status(400).json({
                success: false,
                message: 'Пользователь не связан с преподавателем'
            });
        }
        
        let query = `
            SELECT 
                t.id,
                t.subject,
                t.classes,
                t.dinner,
                t.team,
                t.date,
                EXTRACT(DOW FROM t.date) as day_of_week,
                t.week_num,
                t.num_den,
                t.is_replacement,
                CASE t.num_den
                    WHEN 'num' THEN 'числитель'
                    WHEN 'den' THEN 'знаменатель'
                END as num_den_text,
                -- Находим информацию о замене
                (SELECT r.replacing_teacher 
                 FROM replacement_requests r
                 WHERE r.teacher_name = $1
                 AND r.request_date = t.date
                 AND r.classes = t.classes
                 AND r.subject = t.subject
                 AND r.status = 'confirmed'
                 LIMIT 1) as replaced_by
            FROM timetable t
            WHERE t.teacher = $1
            AND t.is_replacement = true
        `;
        
        const params = [teacherName];
        
        if (date) {
            query += ' AND t.date = $2';
            params.push(date);
        }
        
        query += ' ORDER BY t.date, t.classes';
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            replacements: result.rows
        });
        
    } catch (error) {
        console.error('❌ Ошибка при получении истории замен:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Доступные даты расписания для текущего преподавателя
app.get('/api/schedule/available-dates', Auth.authenticateToken, async (req, res) => {
    try {
        const teacherName = req.user.teacher_name;
        
        if (!teacherName) {
            console.log('❌ Пользователь не связан с преподавателем');
            return res.status(400).json({
                success: false,
                message: 'Пользователь не связан с преподавателем'
            });
        }

        console.log('📅 Ищем даты для преподавателя:', teacherName);

        const datesRes = await pool.query(
            `SELECT DISTINCT date
             FROM timetable
             WHERE teacher = $1
             ORDER BY date`,
            [teacherName]
        );

        console.log('📅 Найдено дат для', teacherName, ':', datesRes.rows.length);
        
        const dates = datesRes.rows.map(r => r.date);
        console.log('📅 Даты:', dates);

        res.json({
            success: true,
            dates: dates
        });
    } catch (error) {
        console.error('❌ Ошибка /api/schedule/available-dates:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера: ' + error.message
        });
    }
});

// ================================================
// ДОСТУПНЫЕ ПРЕПОДАВАТЕЛИ ДЛЯ ЗАМЕНЫ
// ================================================

// Получение списка доступных преподавателей (с коэффициентом)
// Получение списка доступных преподавателей (с коэффициентом)
app.get('/api/teachers/available', Auth.authenticateToken, async (req, res) => {
    try {
        const { date, classes, subject } = req.query;
        const currentTeacher = req.user.teacher_name;
        
        console.log('🔍 Поиск доступных преподавателей:', { date, classes, subject, currentTeacher });
        
        if (!date || !classes || !subject) {
            return res.status(400).json({
                success: false,
                message: 'Необходимы параметры: date, classes, subject'
            });
        }
        
        // Проверяем, существует ли текущий преподаватель
        if (!currentTeacher) {
            return res.status(400).json({
                success: false,
                message: 'Пользователь не связан с преподавателем'
            });
        }
        
        // Получаем всех преподавателей, кроме текущего
        // Сначала проверяем, кто уже занят в это время
        const busyTeachers = await pool.query(
            `SELECT DISTINCT teacher 
             FROM timetable 
             WHERE date = $1 AND classes = $2`,
            [date, parseInt(classes)]
        );

        
        const busyTeacherNames = busyTeachers.rows.map(row => row.teacher);
        console.log('🚫 Занятые преподаватели:', busyTeacherNames);
        
        // По умолчанию используем seminar, так как большинство занятий семинары
        // Можно было бы добавить lesson_type в таблицу timetable для точности
        const lessonType = 'seminar';
        
        // Получаем всех преподавателей с их коэффициентами по предмету
        const teachersQuery = `
            SELECT 
                t.name,
                t.email,
                t.phone,
                COALESCE(
                    (SELECT coefficient 
                     FROM teacher_competencies tc 
                     WHERE tc.teacher_name = t.name 
                     AND tc.subject = $1 
                     AND tc.lesson_type = $2), 
                    0.1  -- Минимальный коэффициент если нет компетенций
                ) as coefficient,
                CASE 
                    WHEN t.name = ANY($3) THEN false
                    ELSE true
                END as is_available
            FROM teachers t
            WHERE t.name != $4
            ORDER BY coefficient DESC, t.name
        `;
        
        const teachersResult = await pool.query(
            teachersQuery, 
            [subject, lessonType, busyTeacherNames, currentTeacher]
        );
        
        console.log(`👨‍🏫 Найдено преподавателей: ${teachersResult.rows.length}`);
        
        // Добавляем дополнительные факторы к коэффициенту
        const teachersWithAdjustedCoefficient = await Promise.all(
            teachersResult.rows.map(async (teacher) => {
                let finalCoefficient = parseFloat(teacher.coefficient);
                
                // Если преподаватель занят, коэффициент = 0
                if (!teacher.is_available) {
                    return {
                        name: teacher.name,
                        email: teacher.email,
                        phone: teacher.phone,
                        coefficient: 0,
                        is_available: false,
                        reason: 'Занят в это время'
                    };
                }
                
                // Фактор опыта: сколько раз преподаватель вел этот предмет
                const experienceResult = await pool.query(
                    `SELECT COUNT(*) as count 
                     FROM timetable 
                     WHERE teacher = $1 AND subject = $2`,
                    [teacher.name, subject]
                );
                
                const experienceCount = parseInt(experienceResult.rows[0].count);
                let experienceBonus = 0;
                
                if (experienceCount > 20) experienceBonus = 0.2;
                else if (experienceCount > 10) experienceBonus = 0.15;
                else if (experienceCount > 5) experienceBonus = 0.1;
                else if (experienceCount > 0) experienceBonus = 0.05;
                
                // Фактор пола (статистический: женщины чаще соглашаются)
                let genderBonus = 0;
                if (teacher.name.endsWith('а') || teacher.name.endsWith('я')) {
                    genderBonus = 0.1;
                }
                
                // Рассчитываем итоговый коэффициент
                finalCoefficient = finalCoefficient + experienceBonus + genderBonus;
                
                // Ограничиваем от 0 до 1
                finalCoefficient = Math.max(0, Math.min(1, finalCoefficient));
                
                return {
                    name: teacher.name,
                    email: teacher.email,
                    phone: teacher.phone,
                    coefficient: parseFloat(finalCoefficient.toFixed(3)),
                    is_available: true,
                    base_coefficient: parseFloat(teacher.coefficient),
                    experience_count: experienceCount,
                    experience_bonus: experienceBonus,
                    gender_bonus: genderBonus
                };
            })
        );
        
        // Сортируем по коэффициенту (по убыванию)
        const sortedTeachers = teachersWithAdjustedCoefficient
            .filter(teacher => teacher.is_available)
            .sort((a, b) => b.coefficient - a.coefficient);
        
        // Добавляем занятых преподавателей в конец
        const busyTeachersList = teachersWithAdjustedCoefficient
            .filter(teacher => !teacher.is_available);
        
        const allTeachers = [...sortedTeachers, ...busyTeachersList];
        
        console.log(`📊 Доступно преподавателей: ${sortedTeachers.length}`);
        
        res.json({
            success: true,
            teachers: allTeachers,
            available_count: sortedTeachers.length,
            busy_count: busyTeachersList.length,
            search_params: {
                date,
                classes,
                subject,
                current_teacher: currentTeacher,
                lesson_type: lessonType
            }
        });
        
    } catch (error) {
        console.error('❌ Ошибка при получении преподавателей:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Получение списка всех предметов
app.get('/api/subjects', Auth.authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT DISTINCT subject FROM timetable ORDER BY subject`
        );
        const subjects = result.rows.map(row => row.subject);
        res.json({ success: true, subjects });
    } catch (error) {
        console.error('❌ Ошибка при получении предметов:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/subjects', Auth.authenticateToken, async (req, res) => {
    // ... старый код
});

// 👇👇👇 ВСТАВИТЬ СЮДА 👇👇👇
app.get('/api/subjects/by-lesson', Auth.authenticateToken, async (req, res) => {
    try {
        const { date, classes } = req.query;
        const teacherName = req.user.teacher_name;
        
        if (!teacherName) {
            return res.status(400).json({
                success: false,
                message: 'Пользователь не связан с преподавателем'
            });
        }
        
        if (!date || !classes) {
            return res.status(400).json({
                success: false,
                message: 'Необходимы параметры: date, classes'
            });
        }
        
        const result = await pool.query(
            `SELECT DISTINCT subject 
             FROM timetable 
             WHERE teacher = $1 AND date = $2 AND classes = $3
             ORDER BY subject`,
            [teacherName, date, parseInt(classes)]
        );
        
        const subjects = result.rows.map(row => row.subject);
        
        res.json({
            success: true,
            subjects: subjects,
            has_schedule: subjects.length > 0
        });
        
    } catch (error) {
        console.error('❌ Ошибка при получении предметов по уроку:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ================================================
// ЗАЯВКИ НА ЗАМЕНУ (Мои заявки / Новая заявка)
// ================================================
// ================================================
// ЗАЯВКИ НА ЗАМЕНУ (Мои заявки / Новая заявка)
// ================================================

// Мои заявки
// Мои заявки - теперь включает заявки где меня выбрали для замены
app.get('/api/requests/my', Auth.authenticateToken, async (req, res) => {
    try {
        const teacherName = req.user.teacher_name;
        const role = req.user.role;
        const userEmail = req.user.email;

        console.log('📋 Запрос заявок от:', { teacherName, role, userEmail });

        let query = '';
        let params = [];

        if (role === 'admin') {
            const filters = buildAdminListFilters(req.query);
            if (filters.error) {
                return res.status(400).json({ success: false, message: filters.error });
            }

            const whereClause = filters.conditions.length
                ? `WHERE ${filters.conditions.join(' AND ')}`
                : '';

            query = `
                SELECT 
                    r.id,
                    r.teacher_name,
                    r.request_date,
                    r.week_num,
                    r.num_den,
                    CASE r.num_den
                        WHEN 'num' THEN 'числитель'
                        WHEN 'den' THEN 'знаменатель'
                    END as num_den_text,
                    r.classes,
                    r.subject,
                    r.team,
                    r.status,
                    r.replacing_teacher,
                    r.admin_comment,
                    r.created_at,
                    r.updated_at,
                    'owner' as request_type
                FROM replacement_requests r
                ${whereClause}
                ORDER BY r.created_at DESC
            `;
            params = filters.params;
        } else if (teacherName) {
            // Преподаватель видит:
            // 1. Свои заявки (которые он создал)
            // 2. Заявки где его выбрали для замены
            query = `
                SELECT 
                    r.id,
                    r.teacher_name,
                    r.request_date,
                    r.week_num,
                    r.num_den,
                    CASE r.num_den
                        WHEN 'num' THEN 'числитель'
                        WHEN 'den' THEN 'знаменатель'
                    END as num_den_text,
                    r.classes,
                    r.subject,
                    r.team,
                    r.status,
                    r.replacing_teacher,
                    r.admin_comment,
                    r.created_at,
                    r.updated_at,
                    CASE 
                        WHEN r.teacher_name = $1 THEN 'owner'
                        WHEN r.replacing_teacher = $1 THEN 'replacement'
                    END as request_type
                FROM replacement_requests r
                WHERE r.teacher_name = $1 OR r.replacing_teacher = $1
                ORDER BY r.created_at DESC
            `;
            params = [teacherName];
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Пользователь не связан с преподавателем' 
            });
        }

        const result = await pool.query(query, params);

        console.log(`📋 Найдено заявок: ${result.rows.length}`);

        res.json({
            success: true,
            requests: result.rows
        });

    } catch (error) {
        console.error('❌ Ошибка при получении заявок:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Ответ на заявку о замене (принять/отклонить)
app.put('/api/requests/:id/respond', Auth.authenticateToken, async (req, res) => {
    try {
        const requestId = req.params.id;
        const teacherName = req.user.teacher_name;
        const { action } = req.body; // 'accept' или 'reject'
        
        console.log('🔄 Ответ на заявку:', { requestId, teacherName, action });
        
        if (!action || !['accept', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Неверное действие. Допустимые значения: accept, reject'
            });
        }
        
        // Получаем детали заявки
        const checkRequest = await pool.query(
            `SELECT teacher_name, replacing_teacher, status, 
                    request_date, classes, subject, team, week_num, num_den
             FROM replacement_requests 
             WHERE id = $1`,
            [requestId]
        );
        
        if (checkRequest.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Заявка не найдена'
            });
        }
        
        const request = checkRequest.rows[0];
        
        // Проверяем, что этого преподавателя выбрали для замены
        if (request.replacing_teacher !== teacherName) {
            return res.status(403).json({
                success: false,
                message: 'Вы не выбраны для замены в этой заявке'
            });
        }
        
        // Проверяем, что заявка еще на рассмотрении
        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Нельзя ответить на заявку со статусом: ' + request.status
            });
        }
        
        // Начинаем транзакцию
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Обновляем статус заявки
            const newStatus = action === 'accept' ? 'confirmed' : 'rejected';
            const adminComment = action === 'accept' 
                ? `Преподаватель ${teacherName} согласился на замену`
                : `Преподаватель ${teacherName} отказался от замены`;
            
            await client.query(
                `UPDATE replacement_requests 
                 SET status = $1, 
                     admin_comment = COALESCE(admin_comment || '\n', '') || $2,
                     updated_at = NOW()
                 WHERE id = $3`,
                [newStatus, adminComment, requestId]
            );
            
            // Если заявка принята
            if (action === 'accept') {
                // Получаем день недели для даты
                const dateObj = new Date(request.request_date);
                const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay(); // Воскресенье = 7
                
                // 1. Добавляем запись в расписание для заменяющего преподавателя
                const existingLesson = await client.query(
                    `SELECT id FROM timetable 
                     WHERE teacher = $1 AND date = $2 AND classes = $3`,
                    [teacherName, request.request_date, request.classes]
                );
                
                if (existingLesson.rows.length === 0) {
                    // Добавляем запись в расписание как замену
                    await client.query(
                        `INSERT INTO timetable 
                            (subject, classes, dinner, team, teacher, date, 
                             day_of_week, week_num, num_den, is_replacement)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
                        [
                            request.subject,
                            request.classes,
                            null, // dinner
                            request.team,
                            teacherName,
                            request.request_date,
                            dayOfWeek,
                            request.week_num || 16,
                            request.num_den || 'num'
                        ]
                    );
                    
                    console.log(`📅 Добавлена замена в расписание для ${teacherName}`);
                }
                
                // 2. Помечаем оригинальное занятие как замененное у оригинального преподавателя
                // Находим оригинальное занятие
                const originalLesson = await client.query(
                    `SELECT id FROM timetable 
                     WHERE teacher = $1 
                     AND date = $2 
                     AND classes = $3 
                     AND subject = $4
                     AND is_replacement = false`,
                    [
                        request.teacher_name,
                        request.request_date,
                        request.classes,
                        request.subject
                    ]
                );
                
                if (originalLesson.rows.length > 0) {
                    // Помечаем как замененное (можно либо удалить, либо пометить флагом)
                    // Вариант А: Помечаем флагом (сохраняем в базе для истории)
                    await client.query(
                        `UPDATE timetable 
                         SET is_replacement = true,
                             teacher = teacher || ' → ' || $1
                         WHERE id = $2`,
                        [teacherName, originalLesson.rows[0].id]
                    );
                    
                    console.log(`📌 Занятие ${originalLesson.rows[0].id} помечено как замененное`);
                    
                    // Вариант Б: Удаляем оригинальное занятие (более чисто)
                    // await client.query(
                    //     `DELETE FROM timetable WHERE id = $1`,
                    //     [originalLesson.rows[0].id]
                    // );
                    // console.log(`🗑️ Занятие ${originalLesson.rows[0].id} удалено у ${request.teacher_name}`);
                } else {
                    console.log(`⚠️ Оригинальное занятие не найдено у ${request.teacher_name}`);
                }
            }
            
            await client.query('COMMIT');
            
            console.log(`✅ Заявка ${requestId} ${action === 'accept' ? 'принята' : 'отклонена'} преподавателем ${teacherName}`);
            
            res.json({
                success: true,
                message: `Вы ${action === 'accept' ? 'приняли' : 'отклонили'} заявку на замену`
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Ошибка при ответе на заявку:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Получение деталей конкретной заявки
app.get('/api/requests/:id', Auth.authenticateToken, async (req, res) => {
    try {
        const requestId = req.params.id;
        const teacherName = req.user.teacher_name;
        const role = req.user.role;
        
        let query = `
            SELECT 
                r.id,
                r.teacher_name,
                r.request_date,
                r.week_num,
                r.num_den,
                CASE r.num_den
                    WHEN 'num' THEN 'числитель'
                    WHEN 'den' THEN 'знаменатель'
                END as num_den_text,
                r.classes,
                r.subject,
                r.team,
                r.status,
                r.replacing_teacher,
                r.admin_comment,
                r.created_at,
                r.updated_at
            FROM replacement_requests r
            WHERE r.id = $1
        `;
        
        let params = [requestId];
        
        // Проверяем права доступа
        if (role !== 'admin') {
            query += ' AND (r.teacher_name = $2 OR r.replacing_teacher = $2)';
            params.push(teacherName);
        }
        
        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Заявка не найдена или у вас нет прав для просмотра'
            });
        }
        
        res.json({
            success: true,
            request: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Ошибка при получении деталей заявки:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Создание новой заявки
app.post('/api/requests', Auth.authenticateToken, async (req, res) => {
    try {
        const teacherName = req.user.teacher_name;
        const { 
            request_date, 
            week_num, 
            num_den, 
            classes, 
            subject, 
            team,
            replacing_teacher 
        } = req.body;
        
        console.log('📝 Создание новой заявки:', {
            teacher: teacherName,
            date: request_date,
            classes,
            subject,
            team,
            replacing_teacher
        });
        
        if (!teacherName) {
            return res.status(400).json({
                success: false,
                message: 'Пользователь не связан с преподавателем'
            });
        }
        
        if (!request_date || !classes || !subject || !team) {
            return res.status(400).json({
                success: false,
                message: 'Обязательные поля: request_date, classes, subject, team'
            });
        }

        // ============================================
        // ПРОВЕРКА: существует ли предмет в расписании
        // ============================================
        try {
            const subjectCheck = await pool.query(
                `SELECT 1 FROM timetable WHERE subject = $1 LIMIT 1`,
                [subject]
            );
            if (subjectCheck.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Предмет не найден в расписании. Выберите предмет из списка.'
                });
            }
        } catch (err) {
            console.error('❌ Ошибка проверки предмета:', err);
            return res.status(500).json({
                success: false,
                message: 'Ошибка проверки предмета'
            });
        }
        
        // Проверяем, существует ли выбранный преподаватель (если указан)
        if (replacing_teacher) {
            const teacherCheck = await pool.query(
                'SELECT name FROM teachers WHERE name = $1',
                [replacing_teacher]
            );
            
            if (teacherCheck.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Выбранный преподаватель не найден'
                });
            }
            
            // Проверяем, не занят ли преподаватель в это время
            const busyCheck = await pool.query(
                `SELECT COUNT(*) as count 
                 FROM timetable 
                 WHERE teacher = $1 AND date = $2 AND classes = $3`,
                [replacing_teacher, request_date, classes]
            );
            
            if (parseInt(busyCheck.rows[0].count) > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Выбранный преподаватель уже занят в это время'
                });
            }
        }
        
        // Проверяем, нет ли уже такой заявки
        const existingRequest = await pool.query(
            `SELECT id FROM replacement_requests 
             WHERE teacher_name = $1 
             AND request_date = $2 
             AND classes = $3 
             AND subject = $4 
             AND status = 'pending'`,
            [teacherName, request_date, classes, subject]
        );
        
        if (existingRequest.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'У вас уже есть активная заявка на эту пару'
            });
        }
        
        // Создаем заявку
        const result = await pool.query(
            `INSERT INTO replacement_requests 
                (teacher_name, request_date, week_num, num_den, classes, subject, team, status, replacing_teacher)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
             RETURNING id`,
            [
                teacherName,
                request_date,
                week_num || null,
                num_den || null,
                classes,
                subject,
                team,
                replacing_teacher || null
            ]
        );
        
        console.log('✅ Заявка создана, ID:', result.rows[0].id);
        
        res.json({
            success: true,
            message: 'Заявка успешно создана',
            request_id: result.rows[0].id
        });
        
    } catch (error) {
        console.error('❌ Ошибка при создании заявки:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Отмена заявки
app.put('/api/requests/:id/cancel', Auth.authenticateToken, async (req, res) => {
    try {
        const requestId = req.params.id;
        const teacherName = req.user.teacher_name;
        const role = req.user.role;
        
        console.log('🗑️ Отмена заявки:', { requestId, teacherName, role });
        
        // Проверяем, существует ли заявка
        const checkRequest = await pool.query(
            `SELECT teacher_name, status FROM replacement_requests WHERE id = $1`,
            [requestId]
        );
        
        if (checkRequest.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Заявка не найдена'
            });
        }
        
        const request = checkRequest.rows[0];
        
        // Проверяем права (только владелец или админ)
        if (role !== 'admin' && request.teacher_name !== teacherName) {
            return res.status(403).json({
                success: false,
                message: 'Нет прав для отмены этой заявки'
            });
        }
        
        // Проверяем, можно ли отменить (только pending)
        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Можно отменять только заявки со статусом "На рассмотрении"'
            });
        }
        
        if (role === 'admin') {
            await pool.query(
                `UPDATE replacement_requests 
                 SET status = 'cancelled',
                     updated_at = NOW(),
                     admin_comment = COALESCE(admin_comment || E'\\n', '') || $2
                 WHERE id = $1`,
                [requestId, 'Отменено администратором']
            );
        } else {
            await pool.query(
                `UPDATE replacement_requests 
                 SET status = 'cancelled', updated_at = NOW()
                 WHERE id = $1`,
                [requestId]
            );
        }
        
        console.log('✅ Заявка отменена');
        
        res.json({
            success: true,
            message: 'Заявка успешно отменена'
        });
        
    } catch (error) {
        console.error('❌ Ошибка при отмене заявки:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ================================================
// АДМИНИСТРАТОР
// ================================================

// История замен: одна строка = одна подтверждённая заявка (без дублей из timetable)
app.get('/api/admin/replacements-history', Auth.authenticateToken, Auth.requireAdmin, async (req, res) => {
    try {
        const filters = buildAdminListFilters(req.query);
        if (filters.error) {
            return res.status(400).json({ success: false, message: filters.error });
        }

        const conditions = [
            'r.replacing_teacher IS NOT NULL',
            ...filters.conditions
        ];
        const params = [...filters.params];

        // Без фильтра по статусу показываем только состоявшиеся замены
        if (!req.query.status) {
            conditions.push(`r.status = 'confirmed'`);
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        const query = `
            SELECT 
                r.id AS request_id,
                r.teacher_name AS original_teacher,
                r.replacing_teacher,
                r.request_date AS date,
                r.classes,
                r.subject,
                r.team,
                r.week_num,
                r.num_den,
                CASE r.num_den
                    WHEN 'num' THEN 'числитель'
                    WHEN 'den' THEN 'знаменатель'
                END AS num_den_text,
                r.status AS request_status,
                r.admin_comment,
                r.created_at AS request_created_at,
                r.updated_at AS request_updated_at,
                (
                    SELECT t.teacher
                    FROM timetable t
                    WHERE t.date = r.request_date
                      AND t.classes = r.classes
                      AND t.subject = r.subject
                      AND t.teacher LIKE r.teacher_name || ' → %'
                    LIMIT 1
                ) AS timetable_teacher
            FROM replacement_requests r
            ${whereClause}
            ORDER BY r.request_date DESC, r.classes ASC, r.id DESC
        `;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            count: result.rows.length,
            filters: {
                from: req.query.from || null,
                to: req.query.to || null,
                status: req.query.status || null,
                teacher: req.query.teacher || null
            },
            history: result.rows
        });
    } catch (error) {
        console.error('❌ Ошибка /api/admin/replacements-history:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Все заявки с фильтрами (алиас для админ-панели)
app.get('/api/admin/requests', Auth.authenticateToken, Auth.requireAdmin, async (req, res) => {
    try {
        const filters = buildAdminListFilters(req.query);
        if (filters.error) {
            return res.status(400).json({ success: false, message: filters.error });
        }

        const whereClause = filters.conditions.length
            ? `WHERE ${filters.conditions.join(' AND ')}`
            : '';

        const result = await pool.query(
            `SELECT 
                r.id,
                r.teacher_name,
                r.request_date,
                r.week_num,
                r.num_den,
                CASE r.num_den
                    WHEN 'num' THEN 'числитель'
                    WHEN 'den' THEN 'знаменатель'
                END AS num_den_text,
                r.classes,
                r.subject,
                r.team,
                r.status,
                r.replacing_teacher,
                r.admin_comment,
                r.created_at,
                r.updated_at
             FROM replacement_requests r
             ${whereClause}
             ORDER BY r.created_at DESC`,
            filters.params
        );

        res.json({
            success: true,
            count: result.rows.length,
            filters: {
                from: req.query.from || null,
                to: req.query.to || null,
                status: req.query.status || null,
                teacher: req.query.teacher || null
            },
            requests: result.rows
        });
    } catch (error) {
        console.error('❌ Ошибка /api/admin/requests:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ================================================
// ПРОФИЛЬ
// ================================================

app.get('/api/profile', Auth.authenticateToken, async (req, res) => {
    try {
        const result = await Auth.getCurrentUser(req.user.email);
        if (!result.success) {
            return res.status(404).json(result);
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Обработчик 404 для API маршрутов
app.use('/api/*', (req, res) => {
    console.log(`❌ API маршрут не найден: ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        message: `Маршрут ${req.originalUrl} не существует`,
        timestamp: new Date().toISOString()
    });
});

// ================================================
// ФРОНТЕНД МАРШРУТЫ
// ================================================

// Главная страница (вход)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Страница dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Любой другой маршрут
app.get('*', (req, res) => {
    res.status(404).send('Страница не найдена');
});

// ================================================
// ЗАПУСК СЕРВЕРА
// ================================================

const startServer = async () => {
    try {
        console.log('🔧 Запуск сервера замены преподавателей...');
        
        // Проверка базы данных
        console.log('🔍 Проверка подключения к PostgreSQL...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ Ошибка подключения к базе данных!');
        } else {
            console.log('✅ База данных подключена успешно!');
        }
        
        // Запуск сервера
        app.listen(PORT, () => {
            console.log(`\n🚀 СЕРВЕР ЗАПУЩЕН!`);
            console.log(`=========================================`);
            console.log(`📡 Порт: ${PORT}`);
            console.log(`\n📌 ОСНОВНЫЕ ССЫЛКИ:`);
            console.log(`   🔗 Главная страница: http://localhost:${PORT}`);
            console.log(`   🔗 Панель управления: http://localhost:${PORT}/dashboard`);
            console.log(`   🔗 Проверка сервера: http://localhost:${PORT}/api/health`);
            console.log(`   🔗 Тест расписания: http://localhost:${PORT}/api/test-schedule`);
            console.log(`\n👥 ТЕСТОВЫЕ ПОЛЬЗОВАТЕЛИ (пароль teacher123):`);
            console.log(`   👨‍🏫 Преподаватель: milekhina@university.ru`);
            console.log(`   👨‍💼 Администратор: admin@university.ru`);
            console.log(`\n⚡ ДЛЯ ОСТАНОВКИ СЕРВЕРА: Ctrl+C`);
            console.log(`=========================================`);
        });
        
    } catch (error) {
        console.error('❌ Ошибка запуска сервера:', error);
        process.exit(1);
    }
};

// Запускаем сервер
startServer();
