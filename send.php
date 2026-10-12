<?php
/**
 * Приём заявки с сайта: отправляет её в Telegram-бот и/или на почту.
 * Настройки — в config.php.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

function reply(bool $ok, string $error = '', int $code = 200): void
{
	http_response_code($code);
	echo json_encode(['ok' => $ok, 'error' => $error], JSON_UNESCAPED_UNICODE);
	exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
	reply(false, 'method', 405);
}

// скрытое поле: живой человек его не заполняет, бот — заполняет
if (!empty($_POST['website'])) {
	reply(true);
}

// длина в символах без зависимости от расширения mbstring
function length(string $s): int
{
	return (int)preg_match_all('/./us', $s);
}

function field(string $key, int $max): string
{
	$value = trim(preg_replace('/\s+/u', ' ', strip_tags((string)($_POST[$key] ?? ''))) ?? '');
	preg_match('/^.{0,' . $max . '}/us', $value, $m);
	return $m[0] ?? '';
}

$name    = field('name', 80);
$contact = field('contact', 80);
$biz     = field('biz', 120) ?: 'не указан';
$plan    = field('plan', 40) ?: 'Пока не знаю';

if (length($name) < 2 || length($contact) < 3) {
	reply(false, 'fields', 422);
}
if (empty($_POST['consent'])) {
	reply(false, 'consent', 422);
}

// не чаще одной заявки в 30 секунд с одного адреса
$lock = sys_get_temp_dir() . '/lead_' . md5($_SERVER['REMOTE_ADDR'] ?? '');
if (is_file($lock) && time() - filemtime($lock) < 30) {
	reply(false, 'rate', 429);
}
@touch($lock);

$config = is_file(__DIR__ . '/config.php') ? (array)require __DIR__ . '/config.php' : [];
$text = "🔥 Новая заявка с сайта\n\n"
	. "Имя: {$name}\n"
	. "Контакт: {$contact}\n"
	. "Бизнес: {$biz}\n"
	. "Тариф: {$plan}";
$sent = false;

if (!empty($config['tg_token']) && !empty($config['tg_chat'])) {
	$context = stream_context_create(['http' => [
		'method'        => 'POST',
		'header'        => "Content-Type: application/x-www-form-urlencoded\r\n",
		'content'       => http_build_query(['chat_id' => $config['tg_chat'], 'text' => $text]),
		'timeout'       => 8,
		'ignore_errors' => true,
	]]);
	$response = @file_get_contents("https://api.telegram.org/bot{$config['tg_token']}/sendMessage", false, $context);
	$sent = $response !== false && (json_decode($response, true)['ok'] ?? false);
}

if (!empty($config['email'])) {
	$host    = preg_replace('/[^a-z0-9.-]/i', '', $_SERVER['SERVER_NAME'] ?? 'localhost');
	$subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта — ' . $name) . '?=';
	$headers = "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\nFrom: noreply@{$host}";
	$sent    = @mail($config['email'], $subject, $text, $headers) || $sent;
}

$sent ? reply(true) : reply(false, 'not_sent', 502);
