<?php
declare(strict_types=1);
require_once __DIR__ . '/../app/bootstrap.php';

if (!user()) {
    validate_api_key();
}

$allColumns = spreadsheet_columns();
$requestedColumns = $_GET['columns'] ?? array_keys($allColumns);
$requestedColumns = is_array($requestedColumns) ? $requestedColumns : array_keys($allColumns);
$columns = array_values(array_intersect($requestedColumns, array_keys($allColumns)));
if (!$columns) {
    $columns = array_keys($allColumns);
}

$params = [];
$filters = academic_filters_from_request();
$base = academic_base_query($filters, $params);
$records = fetch_all(
    'SELECT a.full_name, a.academic_title, u.name university, a.faculty, a.department, a.sub_department, a.email, a.phone, a.profile_url, a.source_url, a.contact_status, a.notes, a.updated_at' . $base . ' ORDER BY a.full_name ASC',
    $params
);

$headers = [];
foreach ($columns as $column) {
    $headers[$column] = $allColumns[$column];
}
$rows = [];
foreach ($records as $record) {
    $row = [];
    foreach ($columns as $column) {
        $row[] = (string) ($record[$column] ?? '');
    }
    $rows[] = $row;
}

$format = strtolower(str_param('format', 10));
if ($format === 'csv') {
    $filename = 'akademisyenler-' . date('Y-m-d-His') . '.csv';
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    echo "\xEF\xBB\xBF";
    $out = fopen('php://output', 'wb');
    fputcsv($out, array_values($headers), ';');
    foreach ($rows as $row) {
        fputcsv($out, $row, ';');
    }
    fclose($out);
    exit;
}

output_xlsx(array_values($headers), $rows, 'akademisyenler-' . date('Y-m-d-His') . '.xlsx');
