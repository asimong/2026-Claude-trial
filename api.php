<?php
/**
 * RegenCHOICE Question Manager - Server API
 * Handles server-side storage of questions
 */

// Enable CORS if needed (remove if not required)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Configuration
define('DATA_DIR', __DIR__ . '/data');
define('QUESTIONS_FILE', DATA_DIR . '/questions.json');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB limit

// Create data directory if it doesn't exist
if (!file_exists(DATA_DIR)) {
    if (!mkdir(DATA_DIR, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to create data directory']);
        exit;
    }
}

// Get action from query parameter
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'load':
        handleLoad();
        break;

    case 'save':
        handleSave();
        break;

    case 'info':
        handleInfo();
        break;

    default:
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid action. Use ?action=load, ?action=save, or ?action=info'
        ]);
        break;
}

/**
 * Load questions from server
 */
function handleLoad() {
    if (!file_exists(QUESTIONS_FILE)) {
        // No file exists yet, return empty array
        echo json_encode([
            'success' => true,
            'questions' => [],
            'message' => 'No questions file found on server'
        ]);
        return;
    }

    $content = file_get_contents(QUESTIONS_FILE);
    if ($content === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to read questions file']);
        return;
    }

    $questions = json_decode($content, true);
    if ($questions === null && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON in questions file']);
        return;
    }

    echo json_encode([
        'success' => true,
        'questions' => $questions,
        'count' => count($questions),
        'lastModified' => filemtime(QUESTIONS_FILE)
    ]);
}

/**
 * Save questions to server
 */
function handleSave() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed. Use POST.']);
        return;
    }

    // Get JSON data from request body
    $input = file_get_contents('php://input');

    if (strlen($input) > MAX_FILE_SIZE) {
        http_response_code(413);
        echo json_encode(['success' => false, 'error' => 'File too large']);
        return;
    }

    // Validate JSON
    $questions = json_decode($input, true);
    if ($questions === null && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON: ' . json_last_error_msg()]);
        return;
    }

    if (!is_array($questions)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Data must be an array of questions']);
        return;
    }

    // Create backup of existing file if it exists
    if (file_exists(QUESTIONS_FILE)) {
        $backupFile = QUESTIONS_FILE . '.backup.' . date('Y-m-d-His');
        copy(QUESTIONS_FILE, $backupFile);

        // Keep only last 5 backups
        cleanupBackups();
    }

    // Save to file with pretty print
    $jsonContent = json_encode($questions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $result = file_put_contents(QUESTIONS_FILE, $jsonContent);

    if ($result === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to write questions file']);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Questions saved successfully',
        'count' => count($questions),
        'bytes' => $result
    ]);
}

/**
 * Get server info
 */
function handleInfo() {
    $info = [
        'success' => true,
        'dataDir' => DATA_DIR,
        'questionsFile' => QUESTIONS_FILE,
        'fileExists' => file_exists(QUESTIONS_FILE),
        'writable' => is_writable(DATA_DIR)
    ];

    if (file_exists(QUESTIONS_FILE)) {
        $info['fileSize'] = filesize(QUESTIONS_FILE);
        $info['lastModified'] = filemtime(QUESTIONS_FILE);
        $info['lastModifiedDate'] = date('Y-m-d H:i:s', filemtime(QUESTIONS_FILE));
    }

    echo json_encode($info);
}

/**
 * Clean up old backup files, keep only last 5
 */
function cleanupBackups() {
    $backups = glob(QUESTIONS_FILE . '.backup.*');
    if (count($backups) > 5) {
        // Sort by modification time, oldest first
        usort($backups, function($a, $b) {
            return filemtime($a) - filemtime($b);
        });

        // Delete oldest backups
        $toDelete = array_slice($backups, 0, count($backups) - 5);
        foreach ($toDelete as $file) {
            unlink($file);
        }
    }
}
