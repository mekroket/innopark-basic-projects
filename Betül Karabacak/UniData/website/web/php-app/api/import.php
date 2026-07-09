<?php
declare(strict_types=1);
require_once __DIR__ . '/../app/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_response(['success' => false, 'message' => 'Yalnızca POST desteklenir.'], 405);
}

validate_api_key();

$raw = file_get_contents('php://input') ?: '';
$rawHash = hash('sha256', $raw);
$payload = json_decode($raw, true);

if (!is_array($payload)) {
    log_activity('validation', 'API import isteğinde geçersiz JSON alındı.', [
        'raw_length' => strlen($raw),
        'raw_sha256' => $rawHash,
        'json_error' => json_last_error_msg(),
        'raw_preview' => function_exists('mb_substr') ? mb_substr($raw, 0, 500, 'UTF-8') : substr($raw, 0, 500),
    ], 'error');
    json_response(['success' => false, 'message' => 'Geçerli JSON gönderilmelidir.', 'json_error' => json_last_error_msg()], 422);
}

$items = extract_import_items($payload);
$payloadSummary = summarize_import_payload($payload, $items);
log_activity('api', 'API import JSON alındı.', [
    'raw_length' => strlen($raw),
    'raw_sha256' => $rawHash,
    'payload' => $payloadSummary,
]);

if (count($items) === 0) {
    log_activity('validation', 'API import içinde işlenecek kayıt bulunamadı.', [
        'raw_sha256' => $rawHash,
        'payload' => $payloadSummary,
    ], 'error');
    json_response([
        'success' => false,
        'message' => 'JSON içinde işlenecek akademisyen kaydı bulunamadı. Dizi, academics, records, data veya items alanı gönderilmelidir.',
        'received' => $payloadSummary,
    ], 422);
}

$validation = validate_import_rows($items);
log_activity('validation', 'API import doğrulaması tamamlandı.', [
    'raw_sha256' => $rawHash,
    'received_count' => count($items),
    'valid_count' => count($validation['valid']),
    'invalid_count' => count($validation['invalid']),
    'invalid_preview' => array_slice($validation['invalid'], 0, 20),
], count($validation['invalid']) > 0 ? 'warning' : 'info');

foreach (array_slice($validation['invalid'], 0, 100) as $invalidRow) {
    log_activity('validation', 'API import satırı reddedildi.', [
        'raw_sha256' => $rawHash,
        'row' => $invalidRow['row'] ?? null,
        'errors' => $invalidRow['errors'] ?? [],
        'received_keys' => $invalidRow['received_keys'] ?? [],
        'mapped_data' => $invalidRow['data'] ?? [],
    ], 'warning');
}

$imported = 0;
$updated = 0;
$databaseErrors = [];

foreach ($validation['valid'] as $index => $item) {
    $sourceRow = $item['_import_row'] ?? ($index + 1);
    try {
        $universityId = ensure_university((string) $item['university']);
        if ($universityId < 1) {
            throw new RuntimeException('Üniversite kaydı oluşturulamadı.');
        }

        $academicData = [
            'university_id' => $universityId,
            'full_name' => $item['full_name'] ?? '',
        ];
        foreach (['academic_title', 'faculty', 'department', 'sub_department', 'email', 'phone', 'profile_url', 'source_url', 'contact_status', 'notes'] as $key) {
            if (array_key_exists($key, $item)) {
                $academicData[$key] = $item[$key];
            }
        }
        $created = upsert_academic($academicData);

        $created ? $imported++ : $updated++;
    } catch (Throwable $e) {
        $databaseErrors[] = [
            'row' => $sourceRow,
            'errors' => [$e->getMessage()],
            'data' => $item,
        ];
        log_activity('error', 'API import satırı veritabanına kaydedilemedi.', [
            'raw_sha256' => $rawHash,
            'row' => $sourceRow,
            'error' => $e->getMessage(),
            'data' => $item,
        ], 'error');
    }
}

$allErrors = array_merge($validation['invalid'], $databaseErrors);
$invalidCount = count($allErrors);

execute_query(
    'INSERT INTO imports (source, total_count, success_count, skipped_count, error_count, validation_report) VALUES (?, ?, ?, ?, ?, ?)',
    ['api', count($items), $imported + $updated, $invalidCount, $invalidCount, json_encode($allErrors, JSON_UNESCAPED_UNICODE)]
);

log_activity('import', 'API üzerinden veri aktarma tamamlandı.', [
    'raw_sha256' => $rawHash,
    'received_count' => count($items),
    'imported' => $imported,
    'updated' => $updated,
    'saved_count' => $imported + $updated,
    'invalid_count' => $invalidCount,
], $invalidCount > 0 ? 'warning' : 'info');

json_response([
    'success' => $invalidCount === 0,
    'message' => $invalidCount === 0
        ? 'API import tamamlandi.'
        : 'API import kismen tamamlandi; bazi kayitlar kaydedilemedi.',
    'received' => count($items),
    'valid' => count($validation['valid']),
    'imported' => $imported,
    'updated' => $updated,
    'saved' => $imported + $updated,
    'skipped' => $invalidCount,
    'invalid' => $invalidCount,
    'errors' => $allErrors,
], $invalidCount > 0 ? 207 : 201);
