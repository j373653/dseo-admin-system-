#!/bin/bash

echo "🔍 DIAGNÓSTICO DETALLADO POSTGRESQL"
echo "===================================="
echo ""

# 1. Verificar configuración listen_addresses
echo "1️⃣ Configuración listen_addresses:"
PG_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i postgres | head -1)
if [ -n "$PG_CONTAINER" ]; then
    docker exec $PG_CONTAINER cat /var/lib/postgresql/data/postgresql.conf 2>/dev/null | grep "listen_addresses" | grep -v "^#" || echo "   Usando configuración por defecto"
fi

echo ""
echo "2️⃣ Configuración pg_hba.conf (autenticación):"
if [ -n "$PG_CONTAINER" ]; then
    docker exec $PG_CONTAINER cat /var/lib/postgresql/data/pg_hba.conf 2>/dev/null | grep -v "^#" | grep -v "^$" | head -20
fi

echo ""
echo "3️⃣ Reglas de Firewall (iptables):"
sudo iptables -L -n | grep 5432 || echo "   No hay reglas específicas para 5432"

echo ""
echo "4️⃣ Reglas de Firewall (ufw):"
sudo ufw status 2>/dev/null | grep -i 5432 || echo "   UFW no está instalado o no tiene reglas para 5432"

echo ""
echo "5️⃣ Procesos escuchando en 5432:"
sudo netstat -tlnp | grep 5432 || sudo ss -tlnp | grep 5432

echo ""
echo "6️⃣ Test desde el propio VPS (debería funcionar):"
timeout 3 psql -h 80.225.188.223 -U postgres -d postgres -c "SELECT 1;" 2>&1 | head -5

echo ""
echo "📋 ANÁLISIS:"
echo "============"
echo ""
echo "Si PostgreSQL está configurado con listen_addresses = 'localhost',"
echo "solo aceptará conexiones locales, no desde tu máquina externa."
echo ""
echo "Para permitir conexiones externas, necesitas:"
echo "1. postgresql.conf: listen_addresses = '*'"
echo "2. pg_hba.conf: Agregar línea 'host all all 0.0.0.0/0 scram-sha-256'"
echo ""
echo "⚠️ NOTA: Abrir PostgreSQL a internet es un riesgo de seguridad."
echo "Mejor usar túnel SSH o VPN para desarrollo local."
