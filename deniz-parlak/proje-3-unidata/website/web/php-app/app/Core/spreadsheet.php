<?php
declare(strict_types=1);

function spreadsheet_columns(): array
{
    return [
        'full_name' => 'Ad Soyad',
        'academic_title' => 'Akademik Unvan',
        'university' => 'Üniversite',
        'faculty' => 'Fakülte',
        'department' => 'Bölüm',
        'sub_department' => 'Anabilim Dalı',
        'email' => 'E-posta',
        'phone' => 'Telefon',
        'profile_url' => 'Profil Linki',
        'source_url' => 'Kaynak Linki',
        'contact_status' => 'İletişim Durumu',
        'notes' => 'Not',
        'updated_at' => 'Son Güncelleme',
    ];

}

function normalize_import_key(string $key): string
{
    $key = normalize_name($key);
    $key = str_replace(
        ['ı', 'ğ', 'ü', 'ş', 'ö', 'ç', 'İ', 'I'],
        ['i', 'g', 'u', 's', 'o', 'c', 'i', 'i'],
        $key
    );
    if (function_exists('iconv')) {
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $key);
        if (is_string($ascii) && $ascii !== '') {
            $key = $ascii;
        }
    }
    $key = str_replace(['ı', 'ğ', 'ü', 'ş', 'ö', 'ç'], ['i', 'g', 'u', 's', 'o', 'c'], $key);
    return preg_replace('/[^a-z0-9]+/i', '', $key) ?: $key;
}

function import_scalar_value(mixed $value): string
{
    if (is_scalar($value) || $value === null) {
        return trim((string) $value);
    }
    if (is_array($value)) {
        foreach (['text', 'value', 'name', 'title', 'label', 'url', 'href'] as $key) {
            if (array_key_exists($key, $value) && (is_scalar($value[$key]) || $value[$key] === null)) {
                return trim((string) $value[$key]);
            }
        }
    }
    return '';
}

function map_import_row(array $row): array
{
    $aliases = [
        'full_name' => ['ad soyad', 'adsoyad', 'ad', 'isim', 'name', 'full name', 'fullname', 'full_name', 'fullName', 'personName', 'person_name', 'academicName', 'academic_name'],
        'academic_title' => ['akademik unvan', 'unvan', 'title', 'academic title', 'academictitle', 'academic_title', 'academicTitle', 'degree', 'rank'],
        'university' => ['üniversite', 'universite', 'university', 'universityName', 'university_name', 'kurum', 'institution', 'institutionName', 'institution_name'],
        'faculty' => ['fakülte', 'fakulte', 'faculty', 'facultyName', 'faculty_name'],
        'department' => ['bölüm', 'bolum', 'department', 'departmentName', 'department_name', 'unit', 'birim'],
        'sub_department' => ['anabilim dalı', 'anabilim dali', 'sub department', 'subdepartment', 'sub_department', 'subDepartment', 'major', 'program', 'field'],
        'email' => ['e-posta', 'eposta', 'email', 'mail', 'emailAddress', 'email_address'],
        'phone' => ['telefon', 'phone', 'tel', 'telephone', 'mobile', 'gsm'],
        'profile_url' => ['profil linki', 'profile url', 'profileurl', 'profile_url', 'profileUrl', 'profileLink', 'profile_link', 'url', 'link'],
        'source_url' => ['kaynak linki', 'source url', 'sourceurl', 'source_url', 'sourceUrl', 'sourceLink', 'source_link', 'pageUrl', 'page_url'],
        'contact_status' => ['iletişim durumu', 'iletisim durumu', 'contact status', 'contactstatus', 'contact_status', 'contactStatus', 'status'],
        'notes' => ['not', 'notes', 'note', 'description', 'aciklama', 'açıklama'],
    ];

    $aliases['full_name'] = array_merge($aliases['full_name'], ['displayName', 'display_name']);
    $aliases['profile_url'] = array_merge($aliases['profile_url'], ['profile', 'href']);
    $aliases['source_url'] = array_merge($aliases['source_url'], ['originUrl', 'origin_url']);

    $normalized = [];
    foreach ($row as $key => $value) {
        $normalized[normalize_import_key((string) $key)] = import_scalar_value($value);
    }

    $mapped = [];
    foreach ($aliases as $target => $labels) {
        foreach ($labels as $label) {
            $normalizedLabel = normalize_import_key($label);
            if (array_key_exists($normalizedLabel, $normalized)) {
                $mapped[$target] = $normalized[$normalizedLabel];
                break;
            }
        }
    }

    return $mapped;
}

function import_row_identifier(array $row, int $index): int|string
{
    foreach (['row', 'rowNumber', 'row_number', 'index', 'sira', 'satir'] as $key) {
        if (isset($row[$key]) && is_scalar($row[$key]) && (string) $row[$key] !== '') {
            return (string) $row[$key];
        }
    }
    return $index + 1;
}

function validate_import_rows(array $rows): array
{
    $valid = [];
    $invalid = [];
    foreach ($rows as $index => $row) {
        if (!is_array($row)) {
            $invalid[] = [
                'row' => $index + 1,
                'errors' => ['Satır nesne formatında olmalıdır.'],
                'data' => ['raw_value' => is_scalar($row) ? (string) $row : gettype($row)],
            ];
            continue;
        }

        $mapped = map_import_row($row);
        $errors = [];
        if (($mapped['full_name'] ?? '') === '') {
            $errors[] = 'Ad Soyad zorunludur.';
        }
        if (($mapped['university'] ?? '') === '') {
            $errors[] = 'Üniversite zorunludur.';
        }
        if (($mapped['email'] ?? '') !== '' && !filter_var($mapped['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'E-posta formatı geçersiz.';
        }
        if (($mapped['contact_status'] ?? '') !== '') {
            $mapped['contact_status'] = valid_contact_status((string) $mapped['contact_status']);
        }

        if ($errors) {
            $invalid[] = [
                'row' => import_row_identifier($row, $index),
                'errors' => $errors,
                'data' => $mapped,
                'received_keys' => array_keys($row),
            ];
        } else {
            $mapped['_import_row'] = import_row_identifier($row, $index);
            $valid[] = $mapped;
        }
    }
    return ['valid' => $valid, 'invalid' => $invalid];
}

function extract_import_items(array $payload): array
{
    if (array_is_list($payload)) {
        return $payload;
    }

    foreach (['academics', 'records', 'data', 'items', 'results', 'rows', 'academicians', 'akademisyenler', 'academic', 'record'] as $key) {
        if (isset($payload[$key]) && is_array($payload[$key])) {
            $value = $payload[$key];
            if (array_is_list($value)) {
                return $value;
            }
            foreach (['academics', 'records', 'data', 'items', 'results', 'rows'] as $nestedKey) {
                if (isset($value[$nestedKey]) && is_array($value[$nestedKey]) && array_is_list($value[$nestedKey])) {
                    return $value[$nestedKey];
                }
            }
            $singleNested = map_import_row($value);
            if (($singleNested['full_name'] ?? '') !== '' || ($singleNested['university'] ?? '') !== '') {
                return [$value];
            }
        }
    }

    $single = map_import_row($payload);
    if (($single['full_name'] ?? '') !== '' || ($single['university'] ?? '') !== '') {
        return [$payload];
    }

    return [];
}

function summarize_import_payload(array $payload, array $items): array
{
    $firstItem = $items[0] ?? null;
    return [
        'top_level_keys' => array_is_list($payload) ? ['<list>'] : array_slice(array_keys($payload), 0, 30),
        'item_count' => count($items),
        'first_item_keys' => is_array($firstItem) ? array_slice(array_keys($firstItem), 0, 30) : [],
        'first_item_mapped' => is_array($firstItem) ? map_import_row($firstItem) : null,
    ];
}

function read_csv_file(string $path): array
{
    $handle = fopen($path, 'rb');
    if (!$handle) {
        throw new RuntimeException('CSV dosyası açılamadı.');
    }
    $headers = fgetcsv($handle, 0, ';');
    if ($headers === false || count($headers) < 2) {
        rewind($handle);
        $headers = fgetcsv($handle, 0, ',');
    }
    if ($headers === false) {
        fclose($handle);
        return [];
    }
    $rows = [];
    while (($data = fgetcsv($handle, 0, ';')) !== false) {
        if (count($data) === 1) {
            $data = str_getcsv((string) $data[0], ',');
        }
        $row = [];
        foreach ($headers as $i => $header) {
            $row[(string) $header] = $data[$i] ?? '';
        }
        if (array_filter($row, fn($value): bool => trim((string) $value) !== '')) {
            $rows[] = $row;
        }
    }
    fclose($handle);
    return $rows;
}

function column_index_from_cell_ref(string $cellRef): int
{
    preg_match('/^[A-Z]+/i', $cellRef, $matches);
    $letters = strtoupper($matches[0] ?? 'A');
    $index = 0;
    for ($i = 0; $i < strlen($letters); $i++) {
        $index = ($index * 26) + (ord($letters[$i]) - 64);
    }
    return $index - 1;
}

function read_xlsx_file(string $path): array
{
    if (!class_exists('ZipArchive')) {
        throw new RuntimeException('XLSX okumak için PHP ZipArchive eklentisi gereklidir.');
    }
    $zip = new ZipArchive();
    if ($zip->open($path) !== true) {
        throw new RuntimeException('XLSX dosyası açılamadı.');
    }
    $shared = [];
    $sharedXml = $zip->getFromName('xl/sharedStrings.xml');
    if ($sharedXml) {
        $sharedDoc = simplexml_load_string($sharedXml);
        if ($sharedDoc) {
            foreach ($sharedDoc->si as $item) {
                $text = '';
                if (isset($item->t)) {
                    $text = (string) $item->t;
                } elseif (isset($item->r)) {
                    foreach ($item->r as $run) {
                        $text .= (string) $run->t;
                    }
                }
                $shared[] = $text;
            }
        }
    }
    $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
    $zip->close();
    if (!$sheetXml) {
        throw new RuntimeException('XLSX içinde ilk sayfa bulunamadı.');
    }
    $sheet = simplexml_load_string($sheetXml);
    if (!$sheet) {
        return [];
    }
    $matrix = [];
    foreach ($sheet->sheetData->row as $row) {
        $cells = [];
        foreach ($row->c as $cell) {
            $attrs = $cell->attributes();
            $idx = column_index_from_cell_ref((string) ($attrs['r'] ?? 'A'));
            $type = (string) ($attrs['t'] ?? '');
            $value = (string) ($cell->v ?? '');
            if ($type === 's') {
                $value = $shared[(int) $value] ?? '';
            } elseif ($type === 'inlineStr') {
                $value = (string) ($cell->is->t ?? '');
            }
            $cells[$idx] = trim($value);
        }
        if ($cells) {
            ksort($cells);
            $matrix[] = $cells;
        }
    }
    if (count($matrix) < 2) {
        return [];
    }
    $headers = $matrix[0];
    $rows = [];
    for ($i = 1; $i < count($matrix); $i++) {
        $row = [];
        foreach ($headers as $idx => $header) {
            $row[(string) $header] = $matrix[$i][$idx] ?? '';
        }
        if (array_filter($row, fn($value): bool => trim((string) $value) !== '')) {
            $rows[] = $row;
        }
    }
    return $rows;
}

function read_spreadsheet_file(string $path, string $name): array
{
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    return match ($ext) {
        'csv' => read_csv_file($path),
        'xlsx' => read_xlsx_file($path),
        default => throw new RuntimeException('Sadece CSV ve XLSX dosyaları desteklenir.'),
    };
}

function xlsx_cell_ref(int $column, int $row): string
{
    $letters = '';
    $column++;
    while ($column > 0) {
        $mod = ($column - 1) % 26;
        $letters = chr(65 + $mod) . $letters;
        $column = intdiv($column - $mod, 26);
    }
    return $letters . $row;
}

function xml_escape(string $value): string
{
    return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
}

function output_xlsx(array $headers, array $rows, string $filename): never
{
    if (!class_exists('ZipArchive')) {
        json_response(['success' => false, 'message' => 'XLSX oluşturmak için PHP ZipArchive eklentisi gereklidir.'], 500);
    }
    $tmp = tempnam(sys_get_temp_dir(), 'xlsx');
    $zip = new ZipArchive();
    $zip->open($tmp, ZipArchive::OVERWRITE);
    $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
    $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
    $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Akademisyenler" sheetId="1" r:id="rId1"/></sheets></workbook>');
    $sheetRows = [];
    $allRows = [array_values($headers), ...$rows];
    foreach ($allRows as $r => $row) {
        $cells = [];
        foreach (array_values($row) as $c => $value) {
            $cells[] = '<c r="' . xlsx_cell_ref($c, $r + 1) . '" t="inlineStr"><is><t>' . xml_escape((string) $value) . '</t></is></c>';
        }
        $sheetRows[] = '<row r="' . ($r + 1) . '">' . implode('', $cells) . '</row>';
    }
    $zip->addFromString('xl/worksheets/sheet1.xml', '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' . implode('', $sheetRows) . '</sheetData></worksheet>');
    $zip->close();
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . filesize($tmp));
    readfile($tmp);
    unlink($tmp);
    exit;
}
