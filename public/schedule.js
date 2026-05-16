// public/schedule.js
class ScheduleModule {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.currentDate = new Date();
        
        // Даты декабря 2025 (15-26 декабря) - в правильном порядке
        this.availableDates = [
            '2025-12-15', '2025-12-16', '2025-12-17', '2025-12-18', '2025-12-19',
            '2025-12-20', '2025-12-21', '2025-12-22', '2025-12-23', '2025-12-24',
            '2025-12-25', '2025-12-26'
        ];
        
        console.log('📅 Создан модуль расписания с датами:', this.availableDates);
    }
    
    async init() {
        console.log('⚙️ Инициализация модуля расписания...');

        try {
            // Настройка UI
            this.setupUI();

            // Выбираем стартовую дату
            this.setInitialDate();

            // Обновляем отображение даты
            this.updateDateDisplay();

            // Загружаем данные на выбранную дату
            await this.loadData();

            console.log('✅ Модуль расписания инициализирован');
            return true;

        } catch (error) {
            console.error('❌ Ошибка инициализации модуля расписания:', error);
            this.showError('Ошибка инициализации: ' + error.message);
            return false;
        }
    }

    setInitialDate() {
        // Сегодняшняя дата
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        console.log('📅 Сегодняшняя дата:', todayStr);
        console.log('📅 Доступные даты:', this.availableDates);
        
        // Проверяем, есть ли сегодня в доступных датах
        const todayIndex = this.availableDates.indexOf(todayStr);
        
        if (todayIndex !== -1) {
            // Сегодня есть в расписании
            this.currentDate = new Date(todayStr + 'T12:00:00');
            console.log(`✅ Начальная дата: сегодня (${todayStr})`);
        } else {
            // Находим ближайшую будущую дату
            let nearestDate = null;
            let nearestDiff = Infinity;
            
            for (const dateStr of this.availableDates) {
                const date = new Date(dateStr + 'T12:00:00');
                const diff = date - today;
                
                if (diff >= 0 && diff < nearestDiff) {
                    nearestDiff = diff;
                    nearestDate = dateStr;
                }
            }
            
            // Если не нашли будущую, берем последнюю доступную
            if (!nearestDate) {
                nearestDate = this.availableDates[this.availableDates.length - 1];
            }
            
            this.currentDate = new Date(nearestDate + 'T12:00:00');
            console.log(`✅ Начальная дата: ближайшая доступная (${nearestDate})`);
        }
    }

    setupUI() {
        console.log('🎨 Настройка UI модуля расписания...');
        
        // Навигация по датам
        this.setupDateNavigation();
    }
    
    setupDateNavigation() {
        const prevBtn = document.getElementById('prevDateBtn');
        const nextBtn = document.getElementById('nextDateBtn');
        const todayBtn = document.getElementById('todayBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                console.log('⬅️ Предыдущий день');
                this.navigateDate(-1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                console.log('➡️ Следующий день');
                this.navigateDate(1);
            });
        }
        
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                console.log('📅 Сегодня');
                this.goToToday();
            });
        }
    }
    
    navigateDate(step) {
        console.log('📅 Навигация. Шаг:', step);
        
        // Получаем текущую дату в формате YYYY-MM-DD
        const currentDateStr = this.currentDate.toISOString().split('T')[0];
        console.log('📅 Текущая дата:', currentDateStr);
        
        // Находим индекс текущей даты в массиве
        let currentIndex = this.availableDates.indexOf(currentDateStr);
        console.log('📅 Текущий индекс:', currentIndex);
        
        if (currentIndex === -1) {
            // Если дата не найдена, ищем ближайшую
            currentIndex = this.findNearestDateIndex(currentDateStr);
            console.log('📅 Ближайший индекс:', currentIndex);
        }
        
        // Вычисляем новый индекс
        const newIndex = currentIndex + step;
        console.log('📅 Новый индекс:', newIndex);
        
        // Проверяем границы массива
        if (newIndex >= 0 && newIndex < this.availableDates.length) {
            const newDateStr = this.availableDates[newIndex];
            this.currentDate = new Date(newDateStr + 'T12:00:00');
            console.log(`✅ Переход к дате: ${newDateStr}`);
            this.updateDateDisplay();
            this.loadData();
        } else {
            console.log(`⚠️ Достигнут ${step > 0 ? 'конец' : 'начало'} списка дат`);
        }
    }
    
    findNearestDateIndex(dateStr) {
        const targetDate = new Date(dateStr + 'T12:00:00');
        let nearestIndex = 0;
        let nearestDiff = Infinity;
        
        for (let i = 0; i < this.availableDates.length; i++) {
            const diff = Math.abs(new Date(this.availableDates[i] + 'T12:00:00') - targetDate);
            if (diff < nearestDiff) {
                nearestDiff = diff;
                nearestIndex = i;
            }
        }
        
        return nearestIndex;
    }

    goToToday() {
        console.log('📅 Переход на сегодня');
        
        // Сегодняшняя дата
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        console.log('📅 Сегодня:', todayStr);
        
        // Проверяем, есть ли сегодня в доступных датах
        const index = this.availableDates.indexOf(todayStr);
        
        if (index !== -1) {
            // Сегодня есть в расписании
            this.currentDate = new Date(todayStr + 'T12:00:00');
            console.log(`✅ Переход на сегодня: ${todayStr}`);
        } else {
            // Находим ближайшую будущую дату
            let nearestDate = null;
            let nearestDiff = Infinity;
            
            for (const dateStr of this.availableDates) {
                const date = new Date(dateStr + 'T12:00:00');
                const diff = date - today;
                
                if (diff >= 0 && diff < nearestDiff) {
                    nearestDiff = diff;
                    nearestDate = dateStr;
                }
            }
            
            // Если не нашли будущую, берем первую доступную
            if (!nearestDate) {
                nearestDate = this.availableDates[0];
            }
            
            this.currentDate = new Date(nearestDate + 'T12:00:00');
            console.log(`✅ Переход на ближайшую доступную дату: ${nearestDate}`);
        }
        
        this.updateDateDisplay();
        this.loadData();
    }
    
    updateNavigationButtons() {
        // Получаем текущую дату в формате YYYY-MM-DD
        const currentDateStr = this.currentDate.toISOString().split('T')[0];
        const currentIndex = this.availableDates.indexOf(currentDateStr);
        
        console.log('🔧 Обновление кнопок. Текущий индекс:', currentIndex);
        
        const prevBtn = document.getElementById('prevDateBtn');
        const nextBtn = document.getElementById('nextDateBtn');
        
        if (prevBtn) {
            const isDisabled = currentIndex <= 0;
            prevBtn.disabled = isDisabled;
            prevBtn.style.opacity = isDisabled ? '0.5' : '1';
            prevBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
            console.log('🔧 Кнопка "Назад":', isDisabled ? 'disabled' : 'enabled');
        }
        
        if (nextBtn) {
            const isDisabled = currentIndex >= this.availableDates.length - 1;
            nextBtn.disabled = isDisabled;
            nextBtn.style.opacity = isDisabled ? '0.5' : '1';
            nextBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
            console.log('🔧 Кнопка "Вперед":', isDisabled ? 'disabled' : 'enabled');
        }
    }

    updateDateDisplay() {
        const dateStr = this.currentDate.toISOString().split('T')[0];
        const formattedDate = new Date(dateStr).toLocaleDateString('ru-RU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const currentDateEl = document.getElementById('currentDate');
        if (currentDateEl) {
            currentDateEl.textContent = formattedDate;
            console.log(`📅 Отображена дата: ${formattedDate} (${dateStr})`);
        }
        
        // Обновляем состояние кнопок навигации
        this.updateNavigationButtons();
    }
    
    async loadData() {
        const dateStr = this.currentDate.toISOString().split('T')[0];
        console.log(`📥 Загрузка расписания на дату: ${dateStr}`);
        
        try {
            this.showLoading();
            
            const endpoint = `/api/schedule?date=${dateStr}`;
            
            console.log(`🌐 Запрос к API: ${endpoint}`);
            
            const data = await this.dashboard.apiRequest(endpoint);
            
            console.log('📊 Получены данные расписания:', data);
            
            if (data && data.success) {
                this.displayData(data);
            } else {
                const message = data?.message || data?.error || 'Не удалось загрузить расписание';
                console.warn('⚠️ Ошибка в данных:', message);
                this.showEmpty(message);
            }
            
        } catch (error) {
            console.error('❌ Ошибка загрузки расписания:', error);
            this.showError('Ошибка загрузки расписания: ' + error.message);
        }
    }
    
    displayData(data) {
        console.log('🎨 Отображение данных расписания...');
        
        this.displayDaySchedule(data);
        
        // После отображения обновляем кнопки навигации
        this.updateNavigationButtons();
    }
    
    displayDaySchedule(data) {
        const container = document.getElementById('dayScheduleContainer');
        
        if (!container) {
            console.error('❌ Контейнер dayScheduleContainer не найден');
            this.showError('Ошибка отображения: контейнер не найден');
            return;
        }
        
        if (!data.schedule || data.schedule.length === 0) {
            this.showEmpty('На выбранную дату занятий нет', container);
            return;
        }
        
        container.innerHTML = data.schedule.map(lesson => {
            const isReplacement = lesson.is_replacement;
            const canRequest = lesson.can_request_replacement;
            
            // Функция для получения времени пары
            const getClassTime = (classNum, dinnerType) => {
                const times = {
                    predlunch: {
                        1: '8:30 - 10:00',
                        2: '10:10 - 11:40', 
                        3: '12:25 - 13:55',
                        4: '14:05 - 15:35',
                        5: '15:55 - 17:25'
                    },
                    postlunch: {
                        1: '8:30 - 10:00',
                        2: '10:10 - 11:40', 
                        3: '11:50 - 13:20',
                        4: '14:05 - 15:35',
                        5: '15:55 - 17:25'
                    },
                    default: {
                        1: '9:00 - 10:30',
                        2: '10:40 - 12:10', 
                        3: '12:40 - 14:10',
                        4: '14:20 - 15:50',
                        5: '16:00 - 17:30'
                    }
                };
                
                return times[dinnerType]?.[classNum] || times.default[classNum] || `${classNum} пара`;
            };
            
            // Функция для получения текста обеда
            const getDinnerText = (dinnerType) => {
                switch(dinnerType) {
                    case 'predlunch': return 'Обед перед 3 парой';
                    case 'postlunch': return 'Обед после 3 пары';
                    default: return '';
                }
            };
            
            const dinnerText = getDinnerText(lesson.dinner);
            const classTime = getClassTime(lesson.classes, lesson.dinner);
            
            return `
                <div class="schedule-item ${isReplacement ? 'replacement' : ''}">
                    <div class="schedule-time">
                        <span class="class-number">${lesson.classes}</span>
                        ${classTime}
                    </div>
                    <div class="schedule-details">
                        <div class="schedule-subject">${lesson.subject}</div>
                        <div class="schedule-meta">
                            <span><i class="fas fa-users"></i> ${lesson.team}</span>
                            <span><i class="fas fa-book"></i> ${lesson.num_den_text || ''}</span>
                            ${dinnerText ? `<span><i class="fas fa-utensils"></i> ${dinnerText}</span>` : ''}
                        </div>
                    </div>
                    <div class="schedule-actions">
                        ${canRequest ? `
                            <button class="request-replacement-btn" 
                                    onclick="dashboard.modules.schedule.requestReplacement(${JSON.stringify(lesson).replace(/"/g, '&quot;')})">
                                <i class="fas fa-exchange-alt"></i> Замена
                            </button>
                        ` : `
                            <button class="request-replacement-btn" disabled title="Недоступно для замены">
                                <i class="fas fa-ban"></i> Недоступно
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join('');
        
        console.log(`✅ Отображено ${data.schedule.length} занятий`);
    }
    
    requestReplacement(lesson) {
        try {
            const confirmMessage = `Перейти к созданию заявки на замену?\n\nПредмет: ${lesson.subject}\nГруппа: ${lesson.team}\nПара: ${lesson.classes}\nДата: ${lesson.date}`;

            if (!confirm(confirmMessage)) return;

            if (this.dashboard && typeof this.dashboard.showSection === 'function') {
                this.dashboard.showSection('new-request');
            }

            const newReqModule = this.dashboard?.modules?.['new-request'];
            if (newReqModule && typeof newReqModule.prefillFromLesson === 'function') {
                newReqModule.prefillFromLesson(lesson);
            } else {
                localStorage.setItem('prefill_lesson', JSON.stringify(lesson));
            }
        } catch (error) {
            this.dashboard.showError('Ошибка перехода к созданию заявки: ' + error.message);
        }
    }
    
    showLoading() {
        const container = document.getElementById('dayScheduleContainer');
        
        if (container) {
            container.innerHTML = `
                <div class="loading-schedule">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Загрузка расписания...</p>
                </div>
            `;
        }
    }
    
    showEmpty(message, container = null) {
        const targetContainer = container || document.getElementById('dayScheduleContainer');
        
        if (targetContainer) {
            targetContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }
    
    showError(message) {
        const container = document.getElementById('dayScheduleContainer');
        
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="dashboard.modules.schedule.loadData()">
                        <i class="fas fa-redo"></i> Попробовать снова
                    </button>
                </div>
            `;
        }
    }
}

window.ScheduleModule = ScheduleModule;