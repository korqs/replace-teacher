DROP TABLE IF EXISTS replacement_requests CASCADE;
DROP TABLE IF EXISTS timetable CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP SCHEMA IF EXISTS api CASCADE;
DROP TABLE IF EXISTS teacher_competencies CASCADE;
CREATE SCHEMA api;
CREATE TABLE teachers (name TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, phone TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE timetable (id SERIAL PRIMARY KEY, subject TEXT NOT NULL, classes INTEGER NOT NULL, dinner TEXT, team TEXT NOT NULL, teacher TEXT NOT NULL, date DATE NOT NULL, day_of_week INTEGER NOT NULL, week_num INTEGER NOT NULL, num_den TEXT NOT NULL, is_replacement BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE replacement_requests (id SERIAL PRIMARY KEY, teacher_name TEXT NOT NULL, request_date DATE NOT NULL, week_num INTEGER NOT NULL, num_den TEXT, classes INTEGER NOT NULL, subject TEXT NOT NULL, team TEXT NOT NULL, status TEXT DEFAULT 'pending', replacing_teacher TEXT, admin_comment TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE api.users (email TEXT PRIMARY KEY, password_hash TEXT NOT NULL, role TEXT NOT NULL, teacher_name TEXT, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE teacher_competencies (id SERIAL PRIMARY KEY, teacher_name TEXT REFERENCES teachers(name) ON DELETE CASCADE, subject TEXT NOT NULL, lesson_type TEXT NOT NULL CHECK (lesson_type IN ('lecture', 'seminar')), coefficient DECIMAL(3,2) NOT NULL CHECK (coefficient >= 0 AND coefficient <= 1));

-- Преподаватели
INSERT INTO teachers (name, email, phone) VALUES ('Милехина', 'milekhina@university.ru', '+7 (999) 222-22-22');
INSERT INTO teachers (name, email, phone) VALUES ('Захарова', 'zaxarova@university.ru', '+7 (999) 333-33-33');
INSERT INTO teachers (name, email, phone) VALUES ('Зубарев', 'zubarev@university.ru', '+7 (999) 444-44-44');
INSERT INTO teachers (name, email, phone) VALUES ('Облакова', 'oblakova@university.ru', '+7 (999) 555-55-55');
INSERT INTO teachers (name, email, phone) VALUES ('Скуднева', 'skudneva@university.ru', '+7 (999) 666-66-66');
INSERT INTO teachers (name, email, phone) VALUES ('Никулкин', 'nikulin@university.ru', '+7 (999) 777-77-77');
INSERT INTO teachers (name, email, phone) VALUES ('Щетинин', 'shchetinin@university.ru', '+7 (999) 888-88-88');

-- Пользователи
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('admin@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'admin', NULL);
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('milekhina@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'teacher', 'Милехина');
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('zaxarova@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'teacher', 'Захарова');
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('zubarev@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'teacher', 'Зубарев');
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('oblakova@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'teacher', 'Облакова');
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('nikulin@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'teacher', 'Никулкин');
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('skudneva@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'teacher', 'Скуднева');
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('shchetinin@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'teacher', 'Щетинин');

-- Удаляем старого администратора если есть проблемы с паролем
DELETE FROM api.users WHERE email = 'admin@university.ru';

-- Создаем нового администратора с паролем "admin123"
INSERT INTO api.users (email, password_hash, role, teacher_name) VALUES ('admin@university.ru', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z4LZ4V7K5G5j5J5J5J5J5J5J5J5J5J', 'admin', NULL);
-- Компетенции преподавателей
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Матан', 'lecture', 0.21);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Матан', 'seminar', 0.11);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Линал', 'lecture', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Линал', 'seminar', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'БД', 'lecture', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'БД', 'seminar', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'ТФКП', 'lecture', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'ТФКП', 'seminar', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Тервер', 'lecture', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Милехина', 'Тервер', 'seminar', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Матан', 'lecture', 0.92);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Матан', 'seminar', 0.92);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Линал', 'lecture', 0.92);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Линал', 'seminar', 0.92);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'БД', 'lecture', 0.92);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'БД', 'seminar', 0.92);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'ТФКП', 'lecture', 0.50);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'ТФКП', 'seminar', 0.50);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Тервер', 'lecture', 0.92);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Захарова', 'Тервер', 'seminar', 0.92);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Матан', 'lecture', 0.65);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Матан', 'seminar', 0.75);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Линал', 'lecture', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Линал', 'seminar', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'БД', 'lecture', 0.30);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'БД', 'seminar', 0.30);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'ТФКП', 'lecture', 0.65);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'ТФКП', 'seminar', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Тервер', 'lecture', 0.90);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Зубарев', 'Тервер', 'seminar', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Матан', 'lecture', 0.75);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Матан', 'seminar', 0.80);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Линал', 'lecture', 0.60);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Линал', 'seminar', 0.60);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'БД', 'lecture', 0.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'БД', 'seminar', 0.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'ТФКП', 'lecture', 0.55);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'ТФКП', 'seminar', 0.60);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Тервер', 'lecture', 0.50);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Облакова', 'Тервер', 'seminar', 0.60);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Матан', 'lecture', 0.72);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Матан', 'seminar', 0.72);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Линал', 'lecture', 0.32);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Линал', 'seminar', 0.32);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'БД', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'БД', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'ТФКП', 'lecture', 0.95);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'ТФКП', 'seminar', 0.95);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Тервер', 'lecture', 0.56);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Скуднева', 'Тервер', 'seminar', 0.56);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Матан', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Матан', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Линал', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Линал', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'БД', 'lecture', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'БД', 'seminar', 1.00);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'ТФКП', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'ТФКП', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Тервер', 'lecture', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Никулкин', 'Тервер', 'seminar', 0.10);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Матан', 'lecture', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Матан', 'seminar', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Линал', 'lecture', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Линал', 'seminar', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'БД', 'lecture', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'БД', 'seminar', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'ТФКП', 'lecture', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'ТФКП', 'seminar', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Тервер', 'lecture', 0.70);
INSERT INTO teacher_competencies (teacher_name, subject, lesson_type, coefficient) VALUES ('Щетинин', 'Тервер', 'seminar', 0.70);

-- РАСПИСАНИЕ ДЛЯ МИЛЕХИНОЙ (15-26 декабря) - КАЖДЫЙ ДЕНЬ
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Линал', 1, NULL, 'ФН11-33Б', 'Милехина', '2025-12-15', 1, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Матан', 2, NULL, 'ФН11-33Б', 'Милехина', '2025-12-15', 1, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('БД', 3, 'predlunch', 'ФН11-33Б', 'Милехина', '2025-12-15', 1, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Линал', 1, NULL, 'ФН11-31Б', 'Милехина', '2025-12-16', 2, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Матан', 2, NULL, 'ФН11-31Б', 'Милехина', '2025-12-16', 2, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Линал', 2, NULL, 'ФН11-32Б', 'Милехина', '2025-12-17', 3, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('ТФКП', 4, NULL, 'ФН11-32Б', 'Милехина', '2025-12-17', 3, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Матан', 1, NULL, 'ФН11-33Б', 'Милехина', '2025-12-18', 4, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Тервер', 3, 'predlunch', 'ФН11-33Б', 'Милехина', '2025-12-18', 4, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Линал', 2, NULL, 'ФН11-31Б', 'Милехина', '2025-12-19', 5, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('БД', 4, NULL, 'ФН11-31Б', 'Милехина', '2025-12-19', 5, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Матан', 1, NULL, 'ФН11-33Б', 'Милехина', '2025-12-22', 1, 17, 'den');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Тервер', 2, NULL, 'ФН11-33Б', 'Милехина', '2025-12-22', 1, 17, 'den');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Линал', 3, 'predlunch', 'ФН11-31Б', 'Милехина', '2025-12-23', 2, 17, 'den');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('ТФКП', 5, NULL, 'ФН11-31Б', 'Милехина', '2025-12-23', 2, 17, 'den');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Матан', 2, NULL, 'ФН11-32Б', 'Милехина', '2025-12-24', 3, 17, 'den');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('БД', 4, NULL, 'ФН11-32Б', 'Милехина', '2025-12-24', 3, 17, 'den');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Линал', 1, NULL, 'ФН11-33Б', 'Милехина', '2025-12-25', 4, 17, 'den');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Тервер', 3, 'predlunch', 'ФН11-33Б', 'Милехина', '2025-12-25', 4, 17, 'den');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('ТФКП', 2, NULL, 'ФН11-31Б', 'Милехина', '2025-12-26', 5, 17, 'den');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Матан', 5, NULL, 'ФН11-31Б', 'Милехина', '2025-12-26', 5, 17, 'den');

-- РАСПИСАНИЕ ДЛЯ ДРУГИХ ПРЕПОДАВАТЕЛЕЙ
-- Захарова
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Матан', 1, NULL, 'ФН11-34Б', 'Захарова', '2025-12-15', 1, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Матан', 2, NULL, 'ФН11-35Б', 'Захарова', '2025-12-16', 2, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Линал', 3, 'predlunch', 'ФН11-36Б', 'Захарова', '2025-12-17', 3, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Тервер', 4, NULL, 'ФН11-34Б', 'Захарова', '2025-12-18', 4, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('ТФКП', 5, NULL, 'ФН11-35Б', 'Захарова', '2025-12-19', 5, 16, 'num');

-- Зубарев
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('ТФКП', 2, NULL, 'ФН11-33Б', 'Зубарев', '2025-12-15', 1, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Матан', 3, 'predlunch', 'ФН11-34Б', 'Зубарев', '2025-12-16', 2, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Линал', 4, NULL, 'ФН11-35Б', 'Зубарев', '2025-12-17', 3, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('БД', 5, NULL, 'ФН11-36Б', 'Зубарев', '2025-12-18', 4, 16, 'num');
INSERT INTO timetable (subject, classes, dinner, team, teacher, date, day_of_week, week_num, num_den) VALUES ('Тервер', 1, NULL, 'ФН11-33Б', 'Зубарев', '2025-12-19', 5, 16, 'num');

-- Заявки
INSERT INTO replacement_requests (teacher_name, request_date, week_num, num_den, classes, subject, team, status, replacing_teacher) VALUES ('Милехина', '2025-12-15', 16, 'num', 2, 'Матан', 'ФН11-33Б', 'pending', NULL);
INSERT INTO replacement_requests (teacher_name, request_date, week_num, num_den, classes, subject, team, status, replacing_teacher) VALUES ('Милехина', '2025-12-17', 16, 'num', 2, 'Матан', 'ФН11-32Б', 'pending', NULL);
INSERT INTO replacement_requests (teacher_name, request_date, week_num, num_den, classes, subject, team, status, replacing_teacher) VALUES ('Зубарев', '2025-12-24', 17, 'den', 4, 'БД', 'ФН11-32Б', 'confirmed', 'Щетинин');

-- Индексы
CREATE INDEX idx_timetable_teacher ON timetable(teacher);
CREATE INDEX idx_timetable_date ON timetable(date);
CREATE INDEX idx_timetable_teacher_date ON timetable(teacher, date);
CREATE INDEX idx_users_email ON api.users(email);
CREATE INDEX idx_teacher_competencies_teacher_subject ON teacher_competencies(teacher_name, subject);
CREATE INDEX idx_teacher_competencies_subject ON teacher_competencies(subject);