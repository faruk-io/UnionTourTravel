<?php
/**
 * send-form.php
 * ------------------------------------------------------------
 * Backend handler for the "Start your visa file" contact form
 * on the Union Tours & Travels website.
 *
 * SETUP (3 steps):
 *   1. Upload this file to the SAME folder as your index.html,
 *      so the form can reach it at "send-form.php".
 *   2. Change $DESK_EMAIL and $SITE_DOMAIN below to your own.
 *   3. Open the site, submit a test enquiry, and check the inbox.
 *
 * If mail() does not arrive (common on some shared hosts, or if
 * your host disables PHP's mail() function), switch to SMTP with
 * PHPMailer — see the commented block near the bottom of this file.
 * ------------------------------------------------------------
 */

// ============== CONFIG — EDIT THESE TWO LINES ==============
$DESK_EMAIL   = 'sinvisa@uniontourstravels.com'; // where enquiries land
$SITE_DOMAIN  = 'uniontourstravels.com';         // your domain, used in the From address
// =============================================================

header('Content-Type: application/json; charset=utf-8');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// ---------- helpers ----------
function clean(string $value): string {
    $value = trim($value);
    $value = str_replace(["\r", "\n"], ' ', $value); // block header injection
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

// ---------- honeypot (silently accept, do not send) ----------
$honeypot = trim($_POST['company_website'] ?? '');
if ($honeypot !== '') {
    echo json_encode(['ok' => true]); // pretend success so the bot moves on
    exit;
}

// ---------- collect + sanitize ----------
$name  = clean($_POST['name']  ?? '');
$phone = clean($_POST['phone'] ?? '');
$email = clean($_POST['email'] ?? '');
$dest  = clean($_POST['dest']  ?? '');
$msg   = clean($_POST['msg']   ?? '');

// ---------- server-side validation (mirrors the front-end rules) ----------
$errors = [];
if (mb_strlen($name) < 3)                                   $errors['name']  = 'Enter your full name.';
if (!preg_match('/^01[3-9]\d{8}$/', $phone))                 $errors['phone'] = 'Enter a valid 11-digit Bangladeshi number.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))              $errors['email'] = 'Enter a valid email address.';
if ($dest === '')                                            $errors['dest']  = 'Select a destination.';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Validation failed', 'fields' => $errors]);
    exit;
}

// ---------- build the email ----------
$subject = "New Visa Enquiry - $dest";

$body  = "New visa enquiry received from the website contact form.\n\n";
$body .= "Name:        $name\n";
$body .= "Phone:       $phone\n";
$body .= "Email:       $email\n";
$body .= "Destination: $dest\n";
$body .= "Details:     " . ($msg !== '' ? $msg : '(none provided)') . "\n\n";
$body .= "Submitted:   " . date('Y-m-d H:i:s') . "\n";
$body .= "IP address:  " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

// Using a no-reply address on YOUR domain avoids most spam filters.
// The applicant's real email is set as Reply-To, so clicking "Reply" goes to them.
$headers  = "From: Union Tours Website <no-reply@$SITE_DOMAIN>\r\n";
$headers .= "Reply-To: $name <$email>\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// ---------- send ----------
$sent = @mail($DESK_EMAIL, $subject, $body, $headers);

if ($sent) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Mail server error. Please try WhatsApp instead.']);
}

/*
 * ------------------------------------------------------------
 * OPTIONAL — MORE RELIABLE DELIVERY WITH SMTP (PHPMailer)
 * ------------------------------------------------------------
 * Plain PHP mail() can be blocked or land in spam on many hosts.
 * For guaranteed delivery, send through your real mailbox (or
 * Gmail / SendGrid / Mailgun) over SMTP using PHPMailer instead.
 *
 * 1. Install PHPMailer:  composer require phpmailer/phpmailer
 *    (or download it manually from github.com/PHPMailer/PHPMailer)
 * 2. Replace the "send" block above with:
 *
 *   require 'vendor/autoload.php';
 *   use PHPMailer\PHPMailer\PHPMailer;
 *
 *   $mail = new PHPMailer(true);
 *   try {
 *       $mail->isSMTP();
 *       $mail->Host       = 'smtp.gmail.com';        // or your host's SMTP
 *       $mail->SMTPAuth   = true;
 *       $mail->Username   = 'you@gmail.com';
 *       $mail->Password   = 'your-app-password';      // use an App Password, not your login password
 *       $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
 *       $mail->Port       = 587;
 *
 *       $mail->setFrom('no-reply@' . $SITE_DOMAIN, 'Union Tours Website');
 *       $mail->addAddress($DESK_EMAIL);
 *       $mail->addReplyTo($email, $name);
 *       $mail->Subject = $subject;
 *       $mail->Body    = $body;
 *
 *       $mail->send();
 *       echo json_encode(['ok' => true]);
 *   } catch (Exception $e) {
 *       http_response_code(500);
 *       echo json_encode(['ok' => false, 'error' => $mail->ErrorInfo]);
 *   }
 *   exit;
 * ------------------------------------------------------------
 */
