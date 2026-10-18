/* Kiashe Studio — язык, страна и валюта посетителя */
(() => {
	'use strict';

	const store = {
		get(k) { try { return localStorage.getItem(k); } catch { return null; } },
		set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} }
	};

	/* ---------- Страна: по часовому поясу, затем по региону языка браузера ---------- */

	const TZ_CITIES = {
		RU: 'Moscow Samara Volgograd Kaliningrad Kirov Ulyanovsk Saratov Astrakhan Yekaterinburg Omsk Novosibirsk Barnaul Tomsk Novokuznetsk Krasnoyarsk Irkutsk Chita Yakutsk Khandyga Vladivostok Ust-Nera Magadan Sakhalin Srednekolymsk Kamchatka Anadyr',
		KZ: 'Almaty Qyzylorda Aqtobe Aqtau Atyrau Oral Qostanay', BY: 'Minsk', UA: 'Kyiv Kiev Uzhgorod Zaporozhye',
		UZ: 'Tashkent Samarkand', KG: 'Bishkek', AM: 'Yerevan', GE: 'Tbilisi', AZ: 'Baku', TJ: 'Dushanbe', MD: 'Chisinau',
		TR: 'Istanbul', GB: 'London', PL: 'Warsaw', CZ: 'Prague', RS: 'Belgrade', IL: 'Jerusalem', AE: 'Dubai', CN: 'Shanghai',
		DE: 'Berlin', FR: 'Paris', ES: 'Madrid', IT: 'Rome', NL: 'Amsterdam', BE: 'Brussels', AT: 'Vienna', PT: 'Lisbon',
		IE: 'Dublin', FI: 'Helsinki', GR: 'Athens', LV: 'Riga', LT: 'Vilnius', EE: 'Tallinn', SK: 'Bratislava', SI: 'Ljubljana',
		LU: 'Luxembourg', MT: 'Malta', CY: 'Nicosia', HR: 'Zagreb'
	};
	const CITY = {};
	Object.entries(TZ_CITIES).forEach(([cc, list]) => list.split(' ').forEach((c) => { CITY[c] = cc; }));

	const EURO = 'DE FR ES IT NL BE AT PT IE FI GR LV LT EE SK SI LU MT CY HR'.split(' ');
	const CURRENCY = {
		RU: 'RUB', KZ: 'KZT', BY: 'BYN', UA: 'UAH', UZ: 'UZS', KG: 'KGS', AM: 'AMD', GE: 'GEL', AZ: 'AZN', TJ: 'TJS', MD: 'MDL',
		TR: 'TRY', GB: 'GBP', PL: 'PLN', CZ: 'CZK', RS: 'RSD', IL: 'ILS', AE: 'AED', CN: 'CNY', US: 'USD', CA: 'CAD', AU: 'AUD', CH: 'CHF'
	};
	EURO.forEach((cc) => { CURRENCY[cc] = 'EUR'; });

	function detectCountry() {
		let tz = '';
		try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch {}
		const city = tz.split('/').pop();
		if (CITY[city]) return CITY[city];
		const langs = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
		for (const l of langs) {
			const region = l.split('-')[1];
			if (region && /^[A-Z]{2}$/i.test(region)) return region.toUpperCase();
		}
		if (tz.startsWith('Europe/')) return 'DE';
		return 'US';
	}

	/* ---------- Курсы: открытый источник без ключа, кэш на 12 часов, запасные значения ---------- */

	// сколько единиц валюты за 1 рубль (примерно, на случай если курс не загрузится)
	const FALLBACK = {
		USD: .0125, EUR: .0107, KZT: 6.3, BYN: .041, UAH: .52, UZS: 158, KGS: 1.09, AMD: 4.85, GEL: .034, AZN: .021,
		TJS: .133, MDL: .22, TRY: .51, GBP: .0093, PLN: .046, CZK: .27, RSD: 1.25, ILS: .046, AED: .046,
		CNY: .089, CAD: .0172, AUD: .019, CHF: .0099
	};
	let rates = { ...FALLBACK };
	const cached = (() => { try { return JSON.parse(store.get('rates') || 'null'); } catch { return null; } })();
	if (cached?.r) rates = { ...rates, ...cached.r };

	async function loadRates() {
		if (cached && Date.now() - cached.t < 12 * 3600e3) return;
		const urls = [
			'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/rub.min.json',
			'https://latest.currency-api.pages.dev/v1/currencies/rub.min.json'
		];
		for (const url of urls) {
			try {
				const res = await fetch(url);
				if (!res.ok) continue;
				const data = await res.json();
				const r = {};
				Object.entries(data.rub || {}).forEach(([k, v]) => { if (typeof v === 'number' && v > 0) r[k.toUpperCase()] = v; });
				if (!r.USD) continue;
				rates = { ...rates, ...r };
				store.set('rates', JSON.stringify({ t: Date.now(), r }));
				renderPrices();
				return;
			} catch {}
		}
	}

	/* ---------- Состояние ---------- */

	const country = detectCountry();
	let lang = window.__lang === 'en' ? 'en' : 'ru';
	let cur = store.get('cur') || CURRENCY[country] || 'USD';
	if (cur !== 'RUB' && !rates[cur]) cur = 'USD';
	const hooks = [];

	const t = (ru, en) => (lang === 'en' ? en : ru);
	const locale = () => (lang === 'en' ? 'en-US' : 'ru-RU');

	/* ---------- Цены ---------- */

	// 3 значащие цифры, без копеек: $62, 29 900 ₸, 793 000 сум
	function nice(v) {
		const step = 10 ** Math.max(0, Math.floor(Math.log10(v)) - 2);
		return Math.max(1, Math.round(v / step) * step);
	}
	function convert(rub) {
		return cur === 'RUB' ? rub : nice(rub * rates[cur]);
	}
	function formatter() {
		return new Intl.NumberFormat(locale(), { style: 'currency', currency: cur, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 0, maximumFractionDigits: 0 });
	}
	function formatPrice(rub) {
		return formatter().format(convert(rub));
	}

	function renderPrices() {
		const nf = formatter();
		document.querySelectorAll('[data-price]').forEach((el) => {
			const v = convert(+el.dataset.price);
			if ('split' in el.dataset) {
				// крупная цена тарифа: символ валюты мельче и на своём месте (₽ после, $ до)
				el.innerHTML = nf.formatToParts(v).map((p) => (p.type === 'currency' ? `<span class="cur">${p.value}</span>` : p.value)).join('');
			} else {
				el.textContent = nf.format(v);
			}
		});
		document.querySelectorAll('[data-price-range]').forEach((el) => {
			const [a, b] = el.dataset.priceRange.split('-').map((n) => convert(+n));
			el.textContent = nf.formatRange ? nf.formatRange(a, b) : `${nf.format(a)}–${nf.format(b)}`;
		});
		const note = document.querySelector('[data-price-note]');
		if (note) {
			note.hidden = cur === 'RUB';
			note.textContent = t(`Цены в ${cur} (${curSymbol(cur)}) указаны примерно, по текущему курсу. Оплата — в рублях.`,
				`Prices in ${cur} (${curSymbol(cur)}) are approximate, at the current exchange rate. Payment is made in Russian rubles.`);
		}
	}

	function curSymbol(c) {
		try {
			return new Intl.NumberFormat(locale(), { style: 'currency', currency: c, currencyDisplay: 'narrowSymbol' })
				.formatToParts(0).find((p) => p.type === 'currency').value;
		} catch { return c; }
	}
	function regionName() {
		try { return new Intl.DisplayNames([locale()], { type: 'region' }).of(country); } catch { return country; }
	}

	/* ---------- Перевод страницы ---------- */

	const DICT = window.I18N_EN || {};
	const PATTERNS = [
		[/^Открыть скриншот (\d+) из (\d+)$/, 'Open screenshot $1 of $2'],
		[/^Скриншоты сайта (.+)$/, (m, name) => `Screenshots of the ${tr(name)} website`]
	];
	const CYR = /[А-Яа-яЁё]/;

	function tr(s) {
		if (lang === 'ru' || !s || !CYR.test(s)) return s;
		const key = s.replace(/\s+/g, ' ').trim();
		let out = DICT[key];
		if (out == null) {
			const p = PATTERNS.find(([re]) => re.test(key));
			if (!p) return s;
			out = key.replace(p[0], p[1]);
		}
		// пробелы по краям текстового узла сохраняем — от них зависят отступы между словами
		return s.match(/^\s*/)[0] + out + s.match(/\s*$/)[0];
	}

	// текст этих элементов меняет сам скрипт (статус, примерка, сообщения) или это цены
	const SKIP = '[data-i18n-skip], [data-price], [data-price-range], [data-try]:not(.try), [data-status-text], [data-hint], [data-form-msg], [data-toast], .shard';
	const ATTRS = ['placeholder', 'aria-label', 'alt', 'title', 'data-title', 'data-copy-msg'];
	const origText = new WeakMap();
	const origAttr = new WeakMap();
	let origTitle = null;

	function translateDOM() {
		if (origTitle == null) origTitle = document.title;
		document.title = tr(origTitle);

		const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
			acceptNode(n) {
				if (n.nodeType === 1 && (/^(SCRIPT|STYLE|svg)$/.test(n.nodeName) || n.matches(SKIP))) {
					return NodeFilter.FILTER_REJECT;
				}
				return NodeFilter.FILTER_ACCEPT;
			}
		});
		for (let n = walker.nextNode(); n; n = walker.nextNode()) {
			if (n.nodeType === 3) {
				if (!origText.has(n)) {
					if (!CYR.test(n.nodeValue)) continue;
					origText.set(n, n.nodeValue);
				}
				const next = tr(origText.get(n));
				if (n.nodeValue !== next) n.nodeValue = next;
				continue;
			}
			for (const a of ATTRS) {
				if (!n.hasAttribute(a)) continue;
				let saved = origAttr.get(n);
				if (!saved) origAttr.set(n, (saved = {}));
				if (!(a in saved)) {
					if (!CYR.test(n.getAttribute(a))) continue;
					saved[a] = n.getAttribute(a);
				}
				n.setAttribute(a, tr(saved[a]));
			}
		}
	}

	/* ---------- Переключатель языка и валюты в шапке ---------- */

	const MENU_CURS = ['RUB', 'USD', 'EUR', 'KZT', 'BYN', 'UAH', 'UZS', 'KGS'];

	function renderSwitcher() {
		const box = document.querySelector('[data-locale]');
		if (!box) return;
		box.querySelector('[data-locale-label]').textContent = `${lang.toUpperCase()} · ${curSymbol(cur)}`;
		const chip = (label, on, data) => `<button type="button" class="locale__chip${on ? ' is-on' : ''}" ${data}>${label}</button>`;
		box.querySelector('[data-locale-langs]').innerHTML =
			chip('Русский', lang === 'ru', 'data-set-lang="ru"') + chip('English', lang === 'en', 'data-set-lang="en"');
		const list = MENU_CURS.includes(cur) ? MENU_CURS : [cur, ...MENU_CURS];
		box.querySelector('[data-locale-curs]').innerHTML = list
			.filter((c) => c === 'RUB' || rates[c])
			.map((c) => chip(curSymbol(c) === c ? c : `${curSymbol(c)} ${c}`, c === cur, `data-set-cur="${c}"`)).join('');
		const manual = store.get('lang') || store.get('cur');
		box.querySelector('[data-locale-note]').innerHTML =
			t(`Регион: ${regionName()}`, `Region: ${regionName()}`) +
			(manual ? ` · <button type="button" class="locale__reset" data-locale-reset>${t('сбросить выбор', 'reset')}</button>` : ` · ${t('определён автоматически', 'detected automatically')}`);
	}

	function initSwitcher() {
		const box = document.querySelector('[data-locale]');
		if (!box) return;
		const btn = box.querySelector('[data-locale-btn]');
		const menu = box.querySelector('[data-locale-menu]');
		const setOpen = (open) => {
			// на телефоне меню во всю ширину, сразу под шапкой (её высота зависит от плашки сверху)
			menu.style.top = innerWidth <= 720 ? box.closest('[data-nav]').getBoundingClientRect().bottom + 8 + 'px' : '';
			menu.hidden = !open;
			btn.setAttribute('aria-expanded', open);
		};
		btn.addEventListener('click', () => setOpen(menu.hidden));
		document.addEventListener('click', (e) => { if (!box.contains(e.target)) setOpen(false); });
		document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
		menu.addEventListener('click', (e) => {
			const b = e.target.closest('button');
			if (!b) return;
			if (b.dataset.setLang) { store.set('lang', b.dataset.setLang); lang = b.dataset.setLang; }
			if (b.dataset.setCur) { store.set('cur', b.dataset.setCur); cur = b.dataset.setCur; }
			if ('localeReset' in b.dataset) {
				store.set('lang', null);
				store.set('cur', null);
				location.reload();
				return;
			}
			apply();
		});
	}

	/* ---------- Применение ---------- */

	function apply() {
		document.documentElement.lang = lang;
		translateDOM();
		renderPrices();
		renderSwitcher();
		hooks.forEach((fn) => fn(lang));
		document.documentElement.classList.remove('i18n-wait');
	}

	window.I18N = {
		get lang() { return lang; },
		get cur() { return cur; },
		country,
		t,
		tr,
		formatPrice,
		onChange(fn) { hooks.push(fn); },
		start() {
			initSwitcher();
			apply();
			loadRates();
		}
	};
})();
