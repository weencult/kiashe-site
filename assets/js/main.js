/* Арсений — сайт-визитка */
(() => {
	'use strict';

	const TG = 'https://t.me/weencult';
	const EMAIL = 'kiashe.cult@gmail.com';
	const PHONE = '+79607330683';
	// ссылка на профиль MAX (Профиль → Поделиться → max.ru/u/…); пока пусто — кнопка копирует номер и открывает MAX
	const MAX = '';

	const $ = (s, root = document) => root.querySelector(s);
	const $$ = (s, root = document) => [...root.querySelectorAll(s)];
	const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const finePointer = matchMedia('(pointer: fine)').matches;

	/* ---------- Сообщение и копирование ---------- */

	const toastEl = $('[data-toast]');
	let toastTimer;
	function toast(text) {
		toastEl.textContent = text;
		toastEl.classList.add('is-on');
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 3600);
	}

	async function copy(text) {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// без HTTPS буфер обмена недоступен — копируем через textarea
			const ta = Object.assign(document.createElement('textarea'), { value: text });
			ta.style.cssText = 'position:fixed;opacity:0';
			document.body.append(ta);
			ta.select();
			document.execCommand('copy');
			ta.remove();
		}
	}

	$$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
		await copy(btn.dataset.copy);
		toast(btn.dataset.copyMsg);
	}));

	/* ---------- Статус «на связи» по московскому времени ---------- */

	(() => {
		const el = $('[data-status]');
		const h = (new Date().getUTCHours() + 3) % 24;
		if (h >= 9 && h < 21) {
			$('[data-status-text]', el).textContent = 'Сейчас на связи · отвечу за 15 минут';
		} else {
			el.classList.add('is-off');
			$('[data-status-text]', el).textContent = 'Сейчас не на связи · отвечу с 9:00 МСК';
		}
	})();

	/* ---------- MAX: чат по ссылке профиля или поиск по номеру ---------- */

	$$('[data-max]').forEach((a) => {
		if (MAX) { a.href = MAX; return; }
		a.addEventListener('click', () => {
			copy(PHONE);
			toast('Номер скопирован — вставьте его в поиск MAX');
		});
	});

	/* ---------- Объявление сверху можно скрыть ---------- */

	$('[data-announce-close]').addEventListener('click', () => {
		document.documentElement.classList.add('no-announce');
		try { localStorage.setItem('announce-hidden', '1'); } catch {}
	});

	/* ---------- Навигация ---------- */

	const nav = $('[data-nav]');
	const burger = $('[data-burger]');
	const menu = $('#nav-menu');
	const dock = $('[data-dock]');
	const contact = $('#contact');

	let scrollQueued = false;
	function onScroll() {
		scrollQueued = false;
		nav.classList.toggle('is-scrolled', scrollY > 40);
		dock.classList.toggle('is-visible', scrollY > 600 && contact.getBoundingClientRect().top > innerHeight);
	}
	addEventListener('scroll', () => {
		if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); }
	}, { passive: true });
	onScroll();

	function setMenu(open) {
		burger.setAttribute('aria-expanded', open);
		burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
		menu.classList.toggle('is-open', open);
		nav.classList.toggle('menu-open', open);
	}
	burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
	menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
	addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

	// подсветка пункта меню текущей секции
	const navLinks = new Map($$('a[href^="#"]', menu).map((a) => [a.hash.slice(1), a]));
	const navIO = new IntersectionObserver((entries) => {
		entries.forEach(({ isIntersecting, target }) => {
			if (!isIntersecting) return;
			navLinks.forEach((a) => a.classList.remove('is-active'));
			navLinks.get(target.id)?.classList.add('is-active');
		});
	}, { rootMargin: '-45% 0px -50% 0px' });
	$$('main > section').forEach((s) => navIO.observe(s));

	$('[data-year]').textContent = new Date().getFullYear();

	/* ---------- Появление блоков ---------- */

	function countUp(el) {
		const to = +el.dataset.count;
		const t0 = performance.now();
		const tick = (t) => {
			const k = Math.min(1, (t - t0) / 1400);
			el.textContent = Math.round(to * (1 - (1 - k) ** 3)).toLocaleString('ru-RU');
			if (k < 1) requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	}

	const revealIO = new IntersectionObserver((entries) => {
		entries.forEach(({ isIntersecting, target: el }) => {
			if (!isIntersecting) return;
			revealIO.unobserve(el);
			el.classList.add('is-in');
			if (!reduceMotion) $$('[data-count]', el).forEach(countUp);
			// после появления снимаем задержки, чтобы hover-эффекты отвечали сразу
			el.addEventListener('transitionend', function done(e) {
				if (e.target !== el || e.propertyName !== 'opacity') return;
				el.removeEventListener('transitionend', done);
				el.removeAttribute('data-reveal');
			});
		});
	}, { rootMargin: '0px 0px -8% 0px' });
	$$('[data-reveal], [data-steps]').forEach((el) => {
		if (!el.closest('.hero')) revealIO.observe(el);
	});
	// счётчики на первом экране стартуют вместе с его анимацией
	if (!reduceMotion) setTimeout(() => $$('.hero [data-count]').forEach(countUp), 700);

	/* ---------- Фон: поле точек, подсвечивается у курсора ---------- */

	(() => {
		const cv = $('[data-bg]');
		const ctx = cv.getContext('2d');
		const GAP = 28, R = 190;
		let W, H, mx = -1e4, my = -1e4, tx = -1e4, ty = -1e4, running = false, last = 0;

		function resize() {
			const dpr = Math.min(devicePixelRatio || 1, 1.5);
			W = innerWidth; H = innerHeight;
			cv.width = W * dpr; cv.height = H * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			draw(0);
		}

		function draw(t) {
			ctx.clearRect(0, 0, W, H);
			mx += (tx - mx) * .12; my += (ty - my) * .12;
			const off = (scrollY * .25) % GAP;
			const lit = [];
			// обычные точки: один цвет, «дышит» только прозрачность
			ctx.fillStyle = '#a0beff';
			for (let y = -off, row = 0; y < H + GAP; y += GAP, row++) {
				for (let x = (row % 2) * GAP / 2; x < W + GAP; x += GAP) {
					const d = Math.hypot(x - mx, y - my);
					if (d < R) { lit.push(x, y, 1 - d / R); continue; }
					ctx.globalAlpha = .09 + Math.sin(x * .011 + t * .0006) * Math.cos(y * .013 - t * .0005) * .05;
					ctx.fillRect(x - .65, y - .65, 1.3, 1.3);
				}
			}
			// точки у курсора: крупнее и синее
			for (let i = 0; i < lit.length; i += 3) {
				const k = lit[i + 2], s = 1.3 + k * 1.9;
				ctx.globalAlpha = .1 + k * .65;
				ctx.fillStyle = `rgb(${255 - 227 * k | 0},${255 - 147 * k | 0},255)`;
				ctx.fillRect(lit[i] - s / 2, lit[i + 1] - s / 2, s, s);
			}
			ctx.globalAlpha = 1;
		}

		function loop(t) {
			if (!running) return;
			if (t - last > (W < 720 ? 40 : 16)) { draw(t); last = t; }
			requestAnimationFrame(loop);
		}
		const start = () => {
			if (running || reduceMotion || document.hidden) return;
			running = true;
			requestAnimationFrame(loop);
		};

		addEventListener('resize', resize);
		addEventListener('pointermove', (e) => {
			if (e.pointerType !== 'mouse') return;
			tx = e.clientX; ty = e.clientY;
			if (mx < -999) { mx = tx; my = ty; }
		}, { passive: true });
		document.addEventListener('mouseleave', () => { tx = ty = -1e4; });
		document.addEventListener('visibilitychange', () => { running = false; start(); });
		resize();
		if (document.readyState === 'complete') start();
		else addEventListener('load', start, { once: true });
	})();

	/* ---------- Плашки: разлетаются на осколки и собираются обратно ---------- */

	const tags = $$('[data-tag]');
	let lastHit = 0;

	// треугольные осколки по сетке со смещёнными внутренними узлами
	function triangles(w, h) {
		const cols = w > 170 ? 4 : 3, rows = 2, P = [];
		for (let i = 0; i <= cols; i++) {
			P[i] = [];
			for (let j = 0; j <= rows; j++) {
				const jx = i % cols ? (Math.random() - .5) * w / cols * .7 : 0;
				const jy = j % rows ? (Math.random() - .5) * h / rows * .6 : 0;
				P[i][j] = [i / cols * w + jx, j / rows * h + jy];
			}
		}
		const out = [];
		for (let i = 0; i < cols; i++) {
			for (let j = 0; j < rows; j++) {
				const [a, b, c, d] = [P[i][j], P[i + 1][j], P[i + 1][j + 1], P[i][j + 1]];
				out.push(...((i + j) % 2 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]]));
			}
		}
		return out;
	}

	async function shatter(wrap) {
		if (wrap.classList.contains('is-busy')) return;
		const tag = wrap.firstElementChild;
		const w = tag.offsetWidth, h = tag.offsetHeight;
		const r = parseFloat(tag.style.getPropertyValue('--r')) || 0;
		const nodes = [], done = [];
		wrap.classList.add('is-busy');

		triangles(w, h).forEach((t) => {
			const s = tag.cloneNode(true);
			s.classList.add('shard');
			s.style.width = w + 'px';
			s.style.height = h + 'px';
			s.style.clipPath = `polygon(${t.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
			wrap.append(s);
			nodes.push(s);

			// осколок вращается вокруг своего центра, сохраняя наклон плашки
			const ox = (t[0][0] + t[1][0] + t[2][0]) / 3 - w / 2;
			const oy = (t[0][1] + t[1][1] + t[2][1]) / 3 - h / 2;
			const ang = Math.atan2(oy * 2.2, ox) + (Math.random() - .5) * .9;
			const dist = 34 + Math.random() * 50;
			const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 12;
			const spin = (Math.random() - .5) * 200;
			const tf = (x, y, a, sc) => `translate(${x}px,${y}px) rotate(${r}deg) translate(${ox}px,${oy}px) rotate(${a}deg) scale(${sc}) translate(${-ox}px,${-oy}px)`;
			const home = tf(0, 0, 0, 1), away = tf(dx, dy, spin, .82);

			done.push(s.animate([
				{ transform: home, easing: 'cubic-bezier(.12,.9,.3,1)' },
				{ transform: away, offset: .38 },
				{ transform: tf(dx * 1.06, dy * 1.06 + 4, spin * 1.08, .82), offset: .52, easing: 'cubic-bezier(.55,0,.25,1.18)' },
				{ transform: home }
			], { duration: 1500 + Math.random() * 250, fill: 'both' }).finished);
		});

		const color = getComputedStyle(tag).backgroundColor;
		for (let k = 0; k < 10; k++) {
			const sp = document.createElement('i');
			sp.className = 'spark';
			sp.style.cssText = `--c:${color};left:${w / 2}px;top:${h / 2}px`;
			wrap.append(sp);
			nodes.push(sp);
			const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 90;
			done.push(sp.animate([
				{ transform: 'scale(1)', opacity: 1 },
				{ transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(0)`, opacity: 0 }
			], { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(.1,.8,.3,1)', fill: 'both' }).finished);
		}

		await Promise.allSettled(done);
		nodes.forEach((n) => n.remove());
		wrap.classList.remove('is-busy');
	}

	if (!reduceMotion) {
		const hit = (t) => {
			if (t.getAnimations().some((a) => a.playState === 'running')) return; // ещё появляется
			lastHit = Date.now();
			shatter(t);
		};
		tags.forEach((t) => {
			t.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hit(t); });
			t.addEventListener('click', () => hit(t));
		});

		// время от времени плашка разбивается сама — подсказка, что их можно трогать
		let heroVisible = true;
		new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe($('.hero'));
		setInterval(() => {
			if (!heroVisible || document.hidden || Date.now() - lastHit < 6000) return;
			const ready = tags.filter((t) => t.offsetParent && !t.classList.contains('is-busy'));
			if (ready.length) shatter(ready[Math.random() * ready.length | 0]);
		}, 4200);
	}
	if (!finePointer) $('[data-hint]').textContent = 'Нажмите на плашки 👆';

	/* ---------- Лайтбокс ---------- */

	const lb = $('[data-lightbox]');
	const lbEl = Object.fromEntries($$('[data-lb]', lb).map((el) => [el.dataset.lb, el]));
	let lbItems = [], lbIndex = 0, lbTitle = '';

	function lbShow(i) {
		const n = lbItems.length;
		lbIndex = (i + n) % n;
		const { src, alt } = lbItems[lbIndex];
		lbEl.img.classList.add('is-fading');
		const pre = new Image();
		pre.onload = pre.onerror = () => {
			lbEl.img.src = src;
			lbEl.img.alt = alt;
			lbEl.img.classList.remove('is-fading');
		};
		pre.src = src;
		lbEl.cap.textContent = lbTitle;
		lbEl.count.textContent = n > 1 ? `${lbIndex + 1} / ${n}` : '';
		lbEl.prev.hidden = lbEl.next.hidden = n < 2;
	}

	lbEl.close.addEventListener('click', () => lb.close());
	lbEl.prev.addEventListener('click', () => lbShow(lbIndex - 1));
	lbEl.next.addEventListener('click', () => lbShow(lbIndex + 1));
	lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
	lb.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
		if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
	});
	const stage = lbEl.img.parentElement;
	let swipeX = null;
	stage.addEventListener('pointerdown', (e) => { swipeX = e.clientX; });
	stage.addEventListener('pointerup', (e) => {
		const dx = e.clientX - (swipeX ?? e.clientX);
		swipeX = null;
		if (Math.abs(dx) > 50 && lbItems.length > 1) lbShow(lbIndex + (dx < 0 ? 1 : -1));
	});

	/* ---------- Галереи работ ---------- */

	const icon = (id) => `<svg class="ico"><use href="#i-${id}"/></svg>`;

	$$('[data-gal]').forEach((gal) => {
		const track = $('.gal__track', gal);
		const slides = $$('.gal__slide', track);
		const n = slides.length;

		track.addEventListener('click', (e) => {
			const s = e.target.closest('.gal__slide');
			if (!s) return;
			lbItems = slides.map((sl) => ({ src: sl.dataset.full, alt: $('img', sl).alt }));
			lbTitle = gal.dataset.title;
			lbShow(slides.indexOf(s));
			lb.showModal();
		});
		if (n < 2) return;

		gal.insertAdjacentHTML('beforeend',
			`<button class="gal__btn gal__btn--prev" type="button" aria-label="Предыдущий скриншот">${icon('left')}</button>` +
			`<button class="gal__btn gal__btn--next" type="button" aria-label="Следующий скриншот">${icon('right')}</button>` +
			`<span class="gal__count"></span><span class="gal__bar" aria-hidden="true"><i style="--w:${100 / n}%"></i></span>`);
		const [prev, next] = $$('.gal__btn', gal);
		const counter = $('.gal__count', gal);
		const bar = $('.gal__bar i', gal);
		let idx = 0, raf = 0;

		const update = () => {
			raf = 0;
			idx = Math.round(track.scrollLeft / track.clientWidth) || 0;
			counter.textContent = `${idx + 1} / ${n}`;
			prev.disabled = idx === 0;
			next.disabled = idx === n - 1;
			bar.style.setProperty('--x', idx * 100 + '%');
		};
		const go = (k) => track.scrollTo({ left: Math.max(0, Math.min(n - 1, k)) * track.clientWidth });

		track.addEventListener('scroll', () => { raf ||= requestAnimationFrame(update); }, { passive: true });
		prev.addEventListener('click', () => go(idx - 1));
		next.addEventListener('click', () => go(idx + 1));
		track.addEventListener('keydown', (e) => {
			if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
			e.preventDefault();
			go(idx + (e.key === 'ArrowRight' ? 1 : -1));
		});
		update();
	});

	// лёгкий 3D-наклон карточек работ за курсором
	if (finePointer && !reduceMotion) {
		$$('.work:not(.work--next)').forEach((card) => {
			card.addEventListener('pointermove', (e) => {
				if (innerWidth < 1100) return;
				const rc = card.getBoundingClientRect();
				const x = (e.clientX - rc.left) / rc.width - .5;
				const y = (e.clientY - rc.top) / rc.height - .5;
				card.style.transform = `perspective(1400px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
			});
			card.addEventListener('pointerleave', () => { card.style.transform = ''; });
		});
	}

	/* ---------- Примерка ---------- */

	const SERIF = '"Lora", Georgia, serif';
	const NARROW = '"Oswald", "Arial Narrow", sans-serif';
	// vars: фон, текст, акцент, приглушённый текст, карточки, шрифт, регистр, текст кнопки, скругление
	const THEMES = {
		coffee: { label: 'Кофейня', font: 'Lora', vars: ['#1c1411', '#f3e9dc', '#c8a165', 'rgba(243,233,220,.62)', 'rgba(255,255,255,.05)', SERIF, 'none', '#1c1411', '4px'],
			eyebrow: 'Кофейня в центре города', title: 'Кофе, который хочется повторить', sub: 'Обжариваем сами, варим медленно. Заходите на пять минут — оставайтесь на час.', btn: 'Забронировать столик', emoji: '☕', cards: ['Меню', 'Атмосфера', 'Как добраться'] },
		beauty: { label: 'Салон красоты', font: 'Lora', vars: ['#fbf1f1', '#2b1b1e', '#d4577a', 'rgba(43,27,30,.62)', 'rgba(212,87,122,.08)', SERIF, 'none', '#fff', '999px'],
			eyebrow: 'Салон красоты', title: 'Красота без спешки и очередей', sub: 'Маникюр, брови и уход у мастеров, к которым возвращаются. Запись онлайн за минуту.', btn: 'Записаться', emoji: '💅', cards: ['Услуги', 'Мастера', 'Цены'] },
		wood: { label: 'Мастерская', font: 'Lora', vars: ['#f4efe6', '#2a211b', '#c4622d', 'rgba(42,33,27,.62)', 'rgba(42,33,27,.05)', SERIF, 'none', '#fff', '999px'],
			eyebrow: 'Столярная мастерская', title: 'Мебель из массива по вашим размерам', sub: 'Дуб, ясень и сосна. От разделочной доски до лестницы — своими руками.', btn: 'Рассчитать стоимость', emoji: '🪵', cards: ['Работы', 'Процесс', 'Цены'] },
		law: { label: 'Юрист', font: 'Lora', vars: ['#f3f0ea', '#1d1b19', '#7a2333', 'rgba(29,27,25,.6)', 'rgba(122,35,51,.06)', SERIF, 'none', '#fff', '2px'],
			eyebrow: 'Юридическая практика', title: 'Защищаю бизнес в суде и на переговорах', sub: 'Понятная стратегия на первой встрече — без юридической латыни.', btn: 'Записаться на консультацию', emoji: '⚖️', cards: ['Практика', 'Опыт', 'Стоимость'] },
		club: { label: 'Компьютерный клуб', font: 'Oswald', vars: ['#0f0a0d', '#fff', '#ff2e4d', 'rgba(255,255,255,.62)', 'rgba(255,46,77,.08)', NARROW, 'uppercase', '#fff', '0px'],
			eyebrow: 'Компьютерный клуб 24/7', title: 'Новый уровень игры', sub: 'Топовое железо, мониторы 240 Гц и турниры каждые выходные.', btn: 'Забронировать место', emoji: '🎮', cards: ['Арена', 'Цены', 'Турниры'] },
		factory: { label: 'Производство', font: 'Oswald', vars: ['#15171a', '#f2f2f2', '#f5b301', 'rgba(242,242,242,.6)', 'rgba(255,255,255,.05)', NARROW, 'uppercase', '#15171a', '0px'],
			eyebrow: 'Собственное производство', title: 'Оборудование напрямую от завода', sub: 'Проектируем, собираем и запускаем линии под ваш процесс — без посредников.', btn: 'Получить расчёт', emoji: '🏭', cards: ['Оборудование', 'Гарантия', 'Контакты'] }
	};
	const VARS = ['--m-bg', '--m-fg', '--m-ac', '--m-mu', '--m-card', '--m-font', '--m-tt', '--m-btn-fg', '--m-r'];
	const TRANSLIT = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };

	const tryBox = $('[data-try]');
	const mock = $('[data-mock]', tryBox);
	const nameIn = $('[data-try-name]', tryBox);
	const T = Object.fromEntries($$('[data-try]', tryBox).map((el) => [el.dataset.try, el]));
	const niches = $$('[data-niche]', tryBox);
	let theme = 'coffee';

	function setName() {
		const n = nameIn.value.trim();
		const slug = [...n.toLowerCase()].map((c) => TRANSLIT[c] ?? c).join('')
			.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
		T.logo.textContent = n || 'Ваш бизнес';
		T.url.textContent = (slug || 'vash-biznes') + '.ru';
		T['cta-label'].textContent = n ? `Хочу такой сайт для «${n}»` : 'Хочу такой сайт';
	}

	function setTheme(key, animate) {
		const th = THEMES[theme = key];
		th.vars.forEach((v, i) => mock.style.setProperty(VARS[i], v));
		['eyebrow', 'title', 'sub', 'btn', 'emoji', 'font'].forEach((k) => { T[k].textContent = th[k]; });
		th.cards.forEach((c, i) => { T['c' + (i + 1)].textContent = c; });
		$$('i', T.swatches).forEach((sw, i) => { sw.style.background = th.vars[[0, 2, 1][i]]; });
		niches.forEach((b) => {
			const on = b.dataset.niche === key;
			b.classList.toggle('is-on', on);
			b.setAttribute('aria-checked', on);
		});
		if (animate) {
			mock.classList.remove('is-swap');
			void mock.offsetWidth; // перезапуск CSS-анимации
			mock.classList.add('is-swap');
		}
	}

	niches.forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.niche, true)));
	nameIn.addEventListener('input', setName);
	setTheme(theme);

	/* ---------- Выбор почты ---------- */

	// mailto: молча не срабатывает без почтовой программы,
	// поэтому открываем веб-почту с уже заполненным письмом
	const mailbox = $('[data-mailbox]');
	const q = encodeURIComponent;
	const MAIL_URLS = {
		gmail: (s, b) => `https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}&su=${q(s)}&body=${q(b)}`,
		yandex: (s, b) => `https://mail.yandex.ru/compose?to=${EMAIL}&subject=${q(s)}&body=${q(b)}`,
		mailru: (s, b) => `https://e.mail.ru/compose/?to=${EMAIL}&subject=${q(s)}&body=${q(b)}`
	};

	function openMail(subject = 'Хочу сайт', body = 'Здравствуйте, Арсений! ') {
		$$('[data-mail-via]', mailbox).forEach((el) => {
			const url = MAIL_URLS[el.dataset.mailVia];
			if (url) el.href = url(subject, body);
		});
		mailbox.showModal();
	}

	$$('[data-mail]').forEach((a) => a.addEventListener('click', (e) => {
		e.preventDefault();
		openMail();
	}));
	$('[data-mailbox-close]').addEventListener('click', () => mailbox.close());
	mailbox.addEventListener('click', async (e) => {
		if (e.target === mailbox) return mailbox.close();
		const item = e.target.closest('[data-mail-via]');
		if (!item) return;
		if (item.dataset.mailVia === 'copy') {
			await copy(EMAIL);
			toast(`Адрес ${EMAIL} скопирован`);
		}
		mailbox.close();
	});

	/* ---------- Связь: Telegram с готовым текстом и короткая заявка ---------- */

	const form = $('[data-form]');
	const formMsg = $('[data-form-msg]', form);
	const tgMain = $('[data-tg-main]');

	// выбор из примерки и тарифов попадает в текст для Telegram и в заявку
	function tgText() {
		const { biz, plan } = form.elements;
		return 'Здравствуйте, Арсений! Хочу сайт' +
			(biz.value ? ` для: ${biz.value}` : '') +
			(plan.value ? `. Тариф — «${plan.value}»` : '') + '.';
	}
	const syncTg = () => { tgMain.href = `${TG}?text=${encodeURIComponent(tgText())}`; };
	T.cta.addEventListener('click', () => {
		const n = nameIn.value.trim();
		form.elements.biz.value = THEMES[theme].label + (n ? ` «${n}»` : '');
		syncTg();
	});
	$$('[data-plan]').forEach((a) => a.addEventListener('click', () => {
		form.elements.plan.value = a.dataset.plan;
		syncTg();
	}));
	syncTg();

	function say(text, ok, link) {
		formMsg.textContent = text;
		formMsg.className = 'form__msg ' + (ok ? 'is-ok' : 'is-err');
		if (link) formMsg.append(' ', Object.assign(document.createElement('a'), { href: link.href, target: '_blank', rel: 'noopener', textContent: link.text }));
	}

	form.addEventListener('submit', (e) => {
		e.preventDefault();
		const f = form.elements;
		const bad = ['name', 'contact', 'consent'].filter((k) => {
			const el = f[k];
			const wrong = el.type === 'checkbox' ? !el.checked : el.value.trim().length < (k === 'contact' ? 3 : 2);
			el.closest('.field').classList.toggle('is-error', wrong);
			return wrong;
		});
		if (bad.length) {
			say(bad.length === 1 && bad[0] === 'consent' ? 'Отметьте согласие на обработку данных.' : 'Укажите имя и телефон или ник в Telegram.');
			f[bad[0]].focus();
			return;
		}

		// сайт статический (GitHub Pages) — заявка уходит готовым сообщением в Telegram
		const text = `${tgText()}\nМеня зовут: ${f.name.value.trim()}\nКонтакт: ${f.contact.value.trim()}`;
		const href = `${TG}?text=${encodeURIComponent(text)}`;
		// без 'noopener' в параметрах: с ним window.open всегда возвращает null
		const win = window.open(href, '_blank');
		if (win) win.opener = null;
		say(win === null ? 'Браузер не дал открыть Telegram.' : 'Открыл Telegram — нажмите «Отправить», и заявка у меня.', win !== null, { href, text: win === null ? 'Открыть Telegram →' : 'Не открылся? Нажмите сюда →' });
	});

	$$('input', form).forEach((i) => i.addEventListener(i.type === 'checkbox' ? 'change' : 'input', () => i.closest('.field')?.classList.remove('is-error')));
})();
