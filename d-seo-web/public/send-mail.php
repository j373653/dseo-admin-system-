<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido"]);
    exit;
}

// Configuración SMTP
$smtp_server = "mail.d-seo.es";
$smtp_port = 465;
$smtp_user = "web@d-seo.es";
$smtp_pass = "Kale@80000";
$to_email = "web@d-seo.es";

// Capturar datos del formulario
$name = $_POST['name'] ?? 'No especificado';
$email = $_POST['email'] ?? 'No especificado';
$message = $_POST['message'] ?? '';
$sector = $_POST['sector'] ?? $_POST['gremio'] ?? '';
$website = $_POST['website'] ?? '';
$subject_prefix = $_POST['_subject'] ?? 'Nuevo contacto desde D-SEO';

$subject = "D-SEO: " . $subject_prefix . " - " . $name;

// Construir cuerpo del mensaje de forma dinámica
$info_extra = "";
if (!empty($sector)) {
    $info_extra .= "<p><strong>Sector/Gremio:</strong> {$sector}</p>";
}
if (!empty($website)) {
    $info_extra .= "<p><strong>URL Web:</strong> <a href='{$website}'>{$website}</a></p>";
}

$mensaje_html = "";
if (!empty($message)) {
    $mensaje_html = "
        <hr style='border: 0; border-top: 1px solid #eeeeee;'>
        <p><strong>Mensaje:</strong></p>
        <p style='white-space: pre-wrap;'>{$message}</p>
    ";
}

$body = "
<html>
<head>
    <title>Nuevo Mensaje de Contacto</title>
</head>
<body style='font-family: sans-serif; background-color: #f4f4f4; padding: 20px;'>
    <div style='background-color: #ffffff; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; border: 1px solid #eeeeee;'>
        <h2 style='color: #00bcd4; margin-top: 0;'>Nuevo lead desde la web</h2>
        <p><strong>Nombre:</strong> {$name}</p>
        <p><strong>Email:</strong> {$email}</p>
        {$info_extra}
        {$mensaje_html}
    </div>
</body>
</html>
";

// Cabeceras para HTML
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: D-SEO Web <" . $smtp_user . ">" . "\r\n";
$headers .= "Reply-To: " . $email . "\r\n";

// Enviar correo (Usando mail() en BanaHosting que suele estar configurado)
// Si BanaHosting requiere PHPMailer para SMTP externo, habría que subir la librería,
// pero usualmente mail() funciona si el 'From' coincide con una cuenta del hosting.
if (mail($to_email, $subject, $body, $headers)) {
    echo json_encode(["status" => "success", "message" => "Mensaje enviado correctamente"]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Ocurrió un error al enviar el mensaje"]);
}
?>