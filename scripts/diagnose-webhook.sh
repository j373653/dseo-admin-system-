#!/bin/bash

echo "🔍 DIAGNÓSTICO WEBHOOK N8N"
echo "==========================="
echo ""

echo "1️⃣ Test desde VPS (localhost):"
timeout 5 curl -X POST http://localhost:5678/webhook/new-lead \
  -H "Content-Type: application/json" \
  -d '{"email":"test@localhost.com","name":"Test Local"}' \
  -v 2>&1 | tail -20

echo ""
echo "2️⃣ Test desde IP pública:"
timeout 5 curl -X POST https://n8n.keepmyweb.com/webhook/new-lead \
  -H "Content-Type: application/json" \
  -d '{"email":"test@external.com","name":"Test External"}' \
  -v 2>&1 | tail -20

echo ""
echo "3️⃣ Verificar contenedor n8n:"
docker ps | grep n8n || echo "❌ No se encontró contenedor n8n"

echo ""
echo "4️⃣ Verificar puertos expuestos:"
netstat -tlnp 2>/dev/null | grep 5678 || ss -tlnp 2>/dev/null | grep 5678 || echo "❌ No se pudo verificar puertos"

echo ""
echo "📋 SOLUCIONES POSIBLES:"
echo "======================="
echo ""
echo "Si el puerto 5678 no está expuesto al exterior:"
echo "  → Ve a Coolify → Servicio n8n → Ports"
echo "  → Asegúrate de que 5678 esté mapeado públicamente"
echo ""
echo "Si hay firewall bloqueando:"
echo "  → sudo ufw allow 5678/tcp  (si usas ufw)"
echo "  → sudo iptables -A INPUT -p tcp --dport 5678 -j ACCEPT  (si usas iptables)"
