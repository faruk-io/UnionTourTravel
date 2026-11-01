UNION TOURS & TRAVELS - WEBSITE (2026)
=====================================
XAMPP (local):
 1. Copy this whole folder to C:\xampp\htdocs\uniontours
 2. Start Apache in XAMPP Control Panel
 3. Open http://localhost/uniontours/

cPanel (live):
 Upload everything inside this folder to public_html (keep the folder structure).
 Edit send-form.php -> $DESK_EMAIL and $SITE_DOMAIN.

Files:
 index.html        main page
 css/style.css     all styling
 js/main.js        animations, validation, form + WhatsApp (edit WHATSAPP_NUMBER)
 send-form.php     email handler
 img/              logo, destination, gallery, payment images
