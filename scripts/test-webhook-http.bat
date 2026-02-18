@echo off
chcp 65001 >nul
echo.
echo 🧪 TEST WEBHOOK NUEVO LEAD (HTTP API)
echo ====================================
echo.
echo Enviando lead de prueba a n8n...
echo.

curl -X POST https://n8n.keepmyweb.com/webhook/new-lead ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"name\":\"Usuario Test\",\"company\":\"Empresa Test\",\"source\":\"test\",\"landing_page\":\"https://d-seo.es/\",\"message\":\"Mensaje de prueba HTTP\"}"

echo.
echo.
echo ✅ Test completado
echo.
echo Verifica:
echo   1. En n8n: Executions (para ver si se ejecuto correctamente)
echo   2. En Supabase: Tabla leads (para ver si se guardo)
echo   3. En tu email: Deberias recibir notificacion
echo.
pause
