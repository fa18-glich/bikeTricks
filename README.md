# 🚵 MTB Skills Pro

A mobile-first PWA / Cordova app for training mountain bike tricks. Your pocket coach for mastering the classic flat-ground tricks — track progress, beat records, take on challenges, and compete with friends.

Built as a single-file HTML app on vanilla JavaScript with a Firebase backend (Auth + Firestore + Storage). No build step, no dependencies to install.

---

## ✨ Features

- **Skills** — 5 tricks (Wheelie, Manual, Trackstand, Bunny-hop, Stoppie) × 4 levels each. Every training set adds +10% progress; complete a level to unlock the next one.
  - Built-in stopwatch, tutorial video, and step-by-step instructions for each trick.
- **Records** — log your best results per trick (distance / height / time) with history charts.
- **Challenges** — auto-generated daily and weekly challenges:
  - **Auto** — the system tracks your progress and claims the reward automatically.
  - **Trust** — combo tricks completed on your word.
- **Garage** — a feed of community bikes with photo uploads and likes.
- **Video proofs** — share YouTube proof of your tricks, react 👍/🔥, and rate with stars (+2 XP for rating).
- **Leaderboard** — global top of riders by XP.
- **Friends** — add friends by a unique 12-character code, send and accept requests.
- **Duels** — challenge a rider, compare results, and win.
- **Reminders** — browser notifications to keep your training streak alive.
- **Gamification** — XP, levels, ranks, achievements, streaks 🔥, and confetti.

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML / CSS / JS (all logic is inside `index.html`) |
| Backend | Firebase — Authentication, Cloud Firestore, Cloud Storage |
| SDK | Firebase compat SDK `10.12.2` (loaded from CDN) |
| Mobile | Cordova WebView (`cordova.js`) + PWA (manifest generated at runtime) |

## 📁 Project Structure

```
Bike_Tricks/
├── index.html      # Single-file app: HTML + styles + all JavaScript
├── css/styles.css  # Standalone copy of the styles (not loaded from index.html)
├── js/             # WIP refactor split into modules (NOT wired into index.html)
│   ├── app.js      #     Firebase, state, cloud sync
│   ├── skills.js   #     Tabs, timer, streak, achievements, training
│   ├── records.js  #     Record keeping
│   └── challenges.js #   Challenge generation & progress
├── image/icon.png  # App icon
└── README.md
```

> **Note:** `index.html` is the real working application. The `js/*.js` files are an in-progress refactoring of the same logic and are currently **not** included by any `<script>` tag. `css/styles.css` mirrors the inline `<style>` block.

## ▶️ Run Locally

No build step — just serve the folder as a static site:

```bash
# Python
python3 -m http.server 8080

# or Node
npx serve .
```

Then open `http://localhost:8080`. Note: Google sign-in requires the domain to be authorized in Firebase; on `localhost` it works out of the box.

## 🔥 Firebase Setup

The Firebase config (`FB_CFG`) is hardcoded in the inline script of `index.html`. To point the app at your own project, replace the config and enable the used services:

- **Authentication** — Google provider + Email/Password. Add your domain to *Authorized domains* (Settings → Authentication).
- **Cloud Firestore** — used collections:

| Collection | Purpose |
|-----------|---------|
| `users` | Per-user state (skills, records, proofs, challenges, achievements...) |
| `leaderboard` | Rider scores for the top list |
| `nicknames` | Unique nickname registry |
| `bikes` | Community bike feed |
| `friends` | Friend pairs (`uids` array) |
| `friend_requests` | Pending friend requests |
| `duels` | Duel challenges |

- **Cloud Storage** — bike photo uploads (compressed client-side, falls back to base64 if Storage is unavailable).

> If you enable *App Check enforcement*, requests will be blocked — the app shows a warning pointing to Firebase Console → App Check.
>
> **Security rules:** the repo ships with `firestore.rules` and `storage.rules`. Deploy them to your Firebase project (Firestore → Rules, Storage → Rules) before going live — they restrict writes to the document owner while keeping public features (leaderboard, bike feed, nickname lookup) working.

## 💾 Data Model

- **Local:** user state lives in `localStorage` under the key `mtb_v16`.
- **Cloud:** state syncs to the `users/{uid}` document; Firestore offline persistence (`enablePersistence`) keeps the app working without a connection.
- Some runtime-only fields (`trSession`, duels) are intentionally excluded from the cloud `users` document.

## 📱 Mobile Build (Cordova)

The page loads `cordova.js` automatically when opened from a `file://` protocol (i.e., inside a Cordova WebView) and skips it on the web, so it can be wrapped in a Cordova WebView and shipped as an Android APK:

```bash
cordova create mtb-app com.example.mtbskills MTBSkills
cd mtb-app
cp /path/to/Bike_Tricks/* www/
cordova platform add android
cordova run android
```

## 📄 License

Free and open source. Do whatever you want with this code — use, modify, redistribute, sell, no restrictions.

---

<!-- ════════════════════════════════════════════════════════════
     Русская версия — Russian version
════════════════════════════════════════════════════════════ -->

# 🚵 MTB Skills Pro

Мобильный-first PWA / Cordova-приложение для тренировки трюков на горном велосипеде. Твой карманный тренер для освоения классических трюков — отслеживай прогресс, бей рекорды, выполняй челленджи и соревнуйся с друзьями.

Собрано как одностраничное HTML-приложение на чистом JavaScript с бэкендом Firebase (Auth + Firestore + Storage). Без сборки, без установки зависимостей.

---

## ✨ Возможности

- **Навыки** — 5 трюков (Вилли, Мэнуал, Трекстенд, Банни-хоп, Стоппи) × 4 уровня. Каждый подход добавляет +10% к прогрессу; заверши уровень — откроется следующий.
  - Встроенный секундомер, обучающее видео и пошаговые инструкции для каждого трюка.
- **Рекорды** — записывай лучшие результаты по каждому трюку (дистанция / высота / время) с графиками истории.
- **Челленджи** — автоматически генерируются дневные и недельные задания:
  - **Авто** — система сама отслеживает прогресс и начисляет награду автоматически.
  - **На доверии** — комбо-трюки, которые засчитываются на слово пользователя.
- **Гараж** — лента байков райдеров с загрузкой фото и лайками.
- **Видео-доказательства** — делись YouTube-видео своих трюков, ставь 👍/🔥 и оценивай звёздами (+2 XP за оценку).
- **Лидерборд** — глобальный топ райдеров по XP.
- **Друзья** — добавляй друзей по уникальному 12-значному коду, отправляй и принимай заявки.
- **Дуэли** — бросай вызов райдеру, сравнивай результаты и побеждай.
- **Напоминания** — браузерные уведомления, чтобы не пропускать тренировки и держать серию.
- **Геймификация** — XP, уровни, ранги, ачивки, серии 🔥 и конфетти.

## 🛠 Технологии

| Слой | Технология |
|-------|-----------|
| Фронтенд | Чистый HTML / CSS / JS (вся логика внутри `index.html`) |
| Бэкенд | Firebase — Authentication, Cloud Firestore, Cloud Storage |
| SDK | Firebase compat SDK `10.12.2` (подключается с CDN) |
| Мобильные | Cordova WebView (`cordova.js`) + PWA (манифест генерируется на лету) |

## 📁 Структура проекта

```
Bike_Tricks/
├── index.html      # Одностраничное приложение: HTML + стили + весь JavaScript
├── css/styles.css  # Отдельная копия стилей (не подключается из index.html)
├── js/             # Рефакторинг в процессе — разбито на модули (НЕ подключено)
│   ├── app.js      #     Firebase, состояние, синхронизация
│   ├── skills.js   #     Вкладки, таймер, серия, ачивки, тренировки
│   ├── records.js  #     Ведение рекордов
│   └── challenges.js #   Генерация челленджей и прогресс
├── image/icon.png  # Иконка приложения
└── README.md
```

> **Примечание:** рабочее приложение — это `index.html`. Файлы `js/*.js` — незавершённый рефакторинг той же логики и сейчас **не** подключаются ни одним `<script>`. `css/styles.css` повторяет inline-блок `<style>`.

## ▶️ Запуск локально

Сборка не нужна — просто отдай папку как статический сайт:

```bash
# Python
python3 -m http.server 8080

# или Node
npx serve .
```

Затем открой `http://localhost:8080`. Обрати внимание: для Google-входа домен должен быть авторизован в Firebase; на `localhost` это работает из коробки.

## 🔥 Настройка Firebase

Конфиг Firebase (`FB_CFG`) зашит в inline-скрипт `index.html`. Чтобы привязать приложение к своему проекту, замени конфиг и включи нужные сервисы:

- **Authentication** — провайдер Google + Email/Password. Добавь свой домен в *Authorized domains* (Settings → Authentication).
- **Cloud Firestore** — используемые коллекции:

| Коллекция | Назначение |
|-----------|---------|
| `users` | Состояние пользователя (навыки, рекорды, доказательства, челленджи, ачивки...) |
| `leaderboard` | Очки райдеров для топа |
| `nicknames` | Реестр уникальных никнеймов |
| `bikes` | Лента байков райдеров |
| `friends` | Пары друзей (массив `uids`) |
| `friend_requests` | Входящие заявки в друзья |
| `duels` | Дуэльные вызовы |

- **Cloud Storage** — загрузка фото байков (сжимается на клиенте, при недоступности Storage — fallback на base64).

> Если включён *App Check enforcement*, запросы будут блокироваться — приложение покажет предупреждение со ссылкой на Firebase Console → App Check.
>
> **Правила безопасности:** в репозитории есть `firestore.rules` и `storage.rules`. Разверни их в своём проекте (Firestore → Rules, Storage → Rules) перед запуском — они ограничивают запись только владельцем документа, сохраняя публичные функции (лидерборд, лента байков, поиск по коду).

## 💾 Модель данных

- **Локально:** состояние пользователя хранится в `localStorage` под ключом `mtb_v16`.
- **Облако:** состояние синхронизируется в документ `users/{uid}`; офлайн-персистентность Firestore (`enablePersistence`) позволяет работать без интернета.
- Некоторые поля, используемые только в рантайме (`trSession`, дуэли), намеренно не сохраняются в облачный документ `users`.

## 📱 Сборка для мобильных (Cordova)

Страница автоматически подключает `cordova.js`, когда открыта по протоколу `file://` (то есть внутри Cordova WebView), и пропускает его в вебе — поэтому её можно обернуть в Cordova WebView и собрать Android APK:

```bash
cordova create mtb-app com.example.mtbskills MTBSkills
cd mtb-app
cp -r /path/to/Bike_Tricks/* www/
cordova platform add android
cordova run android
```

## 📄 Лицензия

Свободная и открытая. Делай с этим кодом что хочешь — используй, изменяй, распространяй, продавай, без ограничений.
