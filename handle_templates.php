<?php
header('Content-Type: application/json');

$templatesDir = __DIR__ . '/templates/';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'save') {
        $name = $_POST['name'] ?? '';
        $content = $_POST['content'] ?? '';
        
        if ($name && $content) {
            $filename = $templatesDir . sanitizeFileName($name) . '.html';
            if (file_put_contents($filename, $content)) {
                echo json_encode(['success' => true, 'message' => 'Plantilla guardada correctamente']);
                exit;
            }
        }
    }
    
    echo json_encode(['success' => false, 'message' => 'Error al guardar la plantilla']);
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'list') {
        $templates = [];
        foreach (glob($templatesDir . "*.html") as $file) {
            $templates[] = [
                'name' => basename($file, '.html'),
                'path' => basename($file)
            ];
        }
        echo json_encode(['success' => true, 'templates' => $templates]);
        exit;
    } else if ($action === 'load') {
        $name = $_GET['name'] ?? '';
        if ($name) {
            $filename = $templatesDir . sanitizeFileName($name) . '.html';
            if (file_exists($filename)) {
                $content = file_get_contents($filename);
                echo json_encode(['success' => true, 'content' => $content]);
                exit;
            }
        }
    }
    
    echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}

function sanitizeFileName($name) {
    return preg_replace('/[^a-z0-9-_]/i', '_', $name);
}
?>
