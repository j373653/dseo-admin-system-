@echo off
chcp 65001 >nul
echo.
echo 🧪 TEST WEBHOOK NUEVO LEAD
echo =========================
echo.
echo Enviando lead de prueba a n8n...
echo.

curl -X POST https://n8n.keepmyweb.com/webhook/new-lead ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"name\":\"Usuario Test\",\"company\":\"Empresa Test\",\"source\":\"test\",\"landing_page\":\"https://d-seo.es/\",\"message\":\"Mensaje de prueba desde Windows\"}"

echo.
echo.
echo ✅ Test completado
echo.
pause
