<div align="center">

<img src="assets/img/icon-512.png" width="96" alt="Kiashe Studio">

# Kiashe Studio

**Сайты, которые продают** — визитки, лендинги и многостраничные сайты для малого бизнеса.<br>
Визитка за 1 день от 4 990 ₽ · Нижний Новгород и удалённо по всей России

[![Сайт](https://img.shields.io/badge/kiashe.ru-открыть_сайт-1c6cff?style=for-the-badge)](https://kiashe.ru)
[![Telegram](https://img.shields.io/badge/Telegram-@weencult-2aabee?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/weencult)

![HTML](https://img.shields.io/badge/HTML5-000814?style=flat-square&logo=html5&logoColor=e34f26)
![CSS](https://img.shields.io/badge/CSS3-000814?style=flat-square&logo=css3&logoColor=1572b6)
![JavaScript](https://img.shields.io/badge/Vanilla_JS-000814?style=flat-square&logo=javascript&logoColor=f7df1e)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-000814?style=flat-square&logo=github&logoColor=white)
![Без фреймворков](https://img.shields.io/badge/без_фреймворков-0_зависимостей-00cc4b?style=flat-square)

<br>

<a href="https://kiashe.ru"><img src="assets/img/og.jpg" width="820" alt="Первый экран сайта Kiashe Studio"></a>

</div>

---

## ✨ Что на сайте

| Блок | Что делает |
|---|---|
| 🎯 **Первый экран** | Оффер, цены и сроки. Плашки ниш разлетаются на осколки при наведении и собираются обратно |
| 🖼 **Работы** | 6 проектов с галереями скриншотов: свайп, стрелки, просмотр на весь экран. У каждого — мини-кейс «Задача → Сделал → Итог» |
| 🪄 **Примерка** | Клиент вписывает название своего бизнеса, выбирает нишу — и видит, как может выглядеть его сайт |
| 🧩 **Что входит и как работаю** | 6 преимуществ и 4 шага от сообщения до запуска |
| 💳 **Цены** | 3 тарифа, условия оплаты 50/50, гарантия и дополнительные услуги |
| ❓ **Вопросы** | 6 главных вопросов клиента |
| 📞 **Контакты** | Telegram, телефон, MAX и почта в главной роли + короткая заявка «Не хотите писать первым?» |

## 🗂 Портфолио

| Проект | Ниша | Формат |
|---|---|---|
| **CyberCat** | Компьютерный клуб | Многостраничный сайт с бронированием |
| **ДозаПром** | Производство | B2B-лендинг с заявкой на расчёт |
| **Уголёк** | Кофейня | Сайт с меню и звонком в 1 клик |
| **Слой** | Столярная мастерская | Портфолио, процесс и цены |
| **Анна Верховцева** | Юрист | Личный бренд и запись на консультацию |
| **BOOST / LOCAL** | Маркетинг-агентство | Редакционный стиль и бриф |

## ⚡ Под капотом

- **Чистый HTML, CSS и JavaScript** — без фреймворков и сборщиков, страница грузится мгновенно.
- **Адаптив** под телефоны, планшеты и широкие мониторы.
- **Свои шрифты** (Inter Tight, Onest) в формате woff2 — ничего не грузится с Google.
- **Картинки в WebP** в двух размерах: телефон не качает лишнего.
- **SEO-база:** мета-теги, микроразметка Schema.org, превью для соцсетей, `sitemap.xml`, `robots.txt`.
- **Доступность:** работа с клавиатуры, подписи к изображениям, режим «уменьшить движение».
- **Заявки** уходят на почту через Web3Forms; если сервис недоступен — клиенту предлагается Telegram с готовым текстом.
- **Статус «на связи»** меняется по московскому времени.

## 📁 Структура

```
├── index.html            главная страница
├── privacy.html          политика конфиденциальности
├── CNAME                 домен kiashe.ru для GitHub Pages
├── robots.txt · sitemap.xml · site.webmanifest · favicon.ico
└── assets/
    ├── css/main.css      все стили
    ├── js/main.js        вся интерактивность
    ├── fonts/            шрифты woff2
    └── img/
        ├── works/        скриншоты работ (N.webp и N-sm.webp)
        └── og.jpg        превью для соцсетей
```

## 🛠 Как поменять данные

| Что | Где |
|---|---|
| Телефон, почта, Telegram | `index.html` — поиск по номеру или адресу; `assets/js/main.js` — константы `TG`, `EMAIL`, `PHONE` в начале файла |
| Ссылка на профиль MAX | `assets/js/main.js` → `const MAX = ''` (ссылка вида `max.ru/u/…`) |
| Ключ формы заявок | `assets/js/main.js` → `const FORM_KEY` (ключ с web3forms.com) |
| Цены и тарифы | `index.html`, блок `<!-- Цены -->` |
| Новая работа | скопировать блок `<article class="work card">` в `index.html` и положить скриншоты в `assets/img/works/название/` |

> После правок CSS или JS увеличьте номер версии в ссылке (`main.css?v=17` → `?v=18`), чтобы у посетителей не осталась старая версия из кэша.

## 🚀 Запуск и публикация

**Посмотреть локально** — открыть `index.html` в браузере или запустить простой сервер:

```bash
python -m http.server 8000
```

и открыть `http://localhost:8000`.

**Опубликовать** — загрузить изменения в ветку `main`: GitHub Pages обновит [kiashe.ru](https://kiashe.ru) за 1–2 минуты.

---

<div align="center">

**Kiashe Studio** · руководитель проектов — Арсений<br>
[kiashe.ru](https://kiashe.ru) · [Telegram](https://t.me/weencult) · [+7 930 839-21-05](tel:+79308392105) · kiashe.cult@gmail.com

<sub>© 2026 Kiashe Studio. Все права защищены.</sub>

</div>
