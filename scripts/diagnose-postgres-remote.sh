#!/bin/bash

echo "🔍 DIAGNÓSTICO POSTGRESQL EXTERNO"
echo "=================================="
echo ""

# Test desde el propio VPS
echo "1️⃣ Test desde localhost del VPS:"
timeout 3 bash -c "</dev/tcp/localhost/5432" 2>/dev/null && echo "   ✅ Puerto 5432 abierto en localhost" || echo "   ❌ Puerto 5432 cerrado en localhost"

echo ""
echo "2️⃣ Test desde IP pública:"
timeout 3 bash -c "</dev/tcp/80.225.188.223/5432" 2>/dev/null && echo "   ✅ Puerto 5432 abierto en 80.225.188.223" || echo "   ❌ Puerto 5432 cerrado en 80.225.188.223"

echo ""
echo "3️⃣ Verificar proceso PostgreSQL:"
if command -v netstat &> /dev/null; then
    netstat -tlnp | grep 5432 || echo "   No se encontró proceso en 5432"
elif command -v ss &> /dev/null; then
    ss -tlnp | grep 5432 || echo "   No se encontró proceso en 5432"
else
    echo "   No se puede verificar (falta netstat/ss)"
fi

echo ""
echo "4️⃣ Contenedores Docker activos:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(supabase|postgres)" || echo "   No se encontraron contenedores PostgreSQL"

echo ""
echo "5️⃣ Verificar configuración pg_hba.conf (si es accesible):"
# Intentar encontrar el archivo de configuración
PG_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i postgres | head -1)
if [ -n "$PG_CONTAINER" ]; then
    echo "   Contenedor PostgreSQL: $PG_CONTAINER"
    echo "   Verificando si acepta conexiones externas..."
    docker exec $PG_CONTAINER cat /var/lib/postgresql/data/pg_hba.conf 2>/dev/null | grep -E "(host|0.0.0.0)" | head -5 || echo "   No se pudo leer configuración"
else
    echo "   No se encontró contenedor PostgreSQL"
fi

echo ""
echo "📋 RECOMENDACIONES:"
echo "==================="
echo ""
echo "Si el puerto está cerrado en la IP pública pero abierto en localhost:"
echo "   → El firewall del VPS está bloqueando el puerto 5432"
echo "   → Solución: Abrir puerto 5432 en el firewall (ufw/iptables)"
echo ""
echo "Si PostgreSQL no acepta conexiones externas:"
echo "   → Necesitas modificar pg_hba.conf para permitir conexiones desde cualquier IP"
echo "   → Agregar: host all all 0.0.0.0/0 scram-sha-256"
echo ""
echo "Comando para abrir puerto en UFW:"
echo "   sudo ufw allow 5432/tcp"
echo ""
echo "Comando para verificar firewall:"
echo "   sudo ufw status"
