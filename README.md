# Калькулятор лазерной резки

Веб-приложение для расчёта времени и стоимости лазерной резки металла. Аналог [laser-calc.vercel.app](https://laser-calc.vercel.app/).

## Возможности

- Расчёт времени реза и полной стоимости заказа
- Выбор материала, газа, толщины, параметров детали
- Настройки цен: электроэнергия, газ, амортизация, наценка
- Коэффициенты стоимости по металлам и толщине (с плавной интерполяцией)
- Сохранение настроек и металлов **в облаке Vercel** — видно на всех устройствах
- Скачивание расчёта в **PDF**
- **Поделиться** — ссылка с параметрами расчёта
- **PWA** — установка на телефон как приложение (Android / iPhone)
- Адаптивный интерфейс для мобильных устройств

## Локальный запуск

```bash
npm install
npm run dev
```

Откройте http://localhost:5173

## Хранение на всех устройствах (Vercel Blob)

- **Сохранить настройки** — цены, газ, наценка → файл в облаке Vercel
- **Сохр.** у металла — список металлов → тот же файл, отдельно
- На другом устройстве откройте приложение — данные подтянутся сами

Параметры текущего заказа (толщина, кол-во деталей) — только на этом устройстве.

### Настройка (один раз)

1. [vercel.com](https://vercel.com) → ваш проект → **Storage**
2. **Create Database** → **Blob** → создайте хранилище
3. **Connect to Project** → выберите `calculator-for-rezka`
4. **Обязательно включите галочку:** `Add a read-write token env var to this connection`
5. **Connect Project** → **Redeploy**

После этого в Environment Variables должны быть **3 переменные**:
- `BLOB_READ_WRITE_TOKEN` ← **эта нужна для сохранения**
- `BLOB_STORE_ID`
- `BLOB_WEBHOOK_PUBLIC_KEY`

### Если ошибка «BLOB_READ_WRITE_TOKEN не настроен»

У вас есть только `BLOB_STORE_ID` — токен не был создан (галочка была выключена).

**Вариант А — вручную (быстрее):**
1. **Storage** → ваш Blob → **Settings** (или три точки) → **Tokens**
2. **Create Token** → тип **Read/Write** → скопируйте токен
3. Проект → **Settings** → **Environment Variables** → **Add**
   - Name: `BLOB_READ_WRITE_TOKEN`
   - Value: вставьте токен
   - Environments: Production + Preview
4. **Redeploy**

**Вариант Б — переподключить:**
1. Удалите старые переменные `BLOB_STORE_ID` и `BLOB_WEBHOOK_PUBLIC_KEY` (опционально)
2. Storage → Blob → **Connect to Project** снова
3. **Включите** `Add a read-write token env var to this connection`
4. **Redeploy**

### Локальная разработка

```bash
npm i -g vercel
vercel env pull .env.local
vercel dev
```

Без `vercel dev` локально данные сохраняются только в браузере.

### Ошибка «This store does not exist»

Токен `BLOB_READ_WRITE_TOKEN` есть, но он **от старого или удалённого** хранилища.

**Исправление (5 минут):**

1. Vercel → **Storage** — убедитесь, что Blob Store **существует** (не пустой список)
2. Откройте **этот** Blob → **Settings** → **Tokens**
3. **Create Token** → **Read/Write** → скопируйте **новый** токен
4. Проект → **Settings** → **Environment Variables** → **BLOB_READ_WRITE_TOKEN** → **Edit** → вставьте новый токен
5. **Redeploy**
6. Проверьте: `/api/health` → должно быть `"blobWorks":true`

Если не помогло — **полный сброс:**
1. Удалите все переменные `BLOB_*` из проекта
2. Storage → **Create Database** → **Blob** (новый)
3. **Connect to Project** + галочка **read-write token**
4. **Redeploy**

### Ошибка «Failed to fetch»

1. Откройте: `https://ваш-сайт.vercel.app/api/health`
   - Должно быть: `{"ok":true,"blobToken":true,"blobWorks":true}`
   - Если `blobWorks:false` — смотрите `blobError` в ответе

## Публикация по ссылке (Vercel)

1. Загрузите проект на GitHub
2. Зайдите на [vercel.com](https://vercel.com) → New Project → импортируйте репозиторий
3. Нажмите Deploy — получите ссылку вида `https://ваш-проект.vercel.app`

Или через CLI:

```bash
npm i -g vercel
vercel
```

## Установка на телефон

**Android (Chrome):** меню ⋮ → «Установить приложение» или «Добавить на главный экран»

**iPhone (Safari):** Поделиться → «На экран Домой»

Кнопка «📱 Установить» в приложении показывает эту инструкцию.

## Сборка

```bash
npm run build
npm run preview
```
