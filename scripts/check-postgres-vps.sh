#!/bin/bash

echo "🔍 DIAGNÓSTICO CONECTIVIDAD POSTGRESQL"
echo "======================================="
echo ""

# Verificar si PostgreSQL está escuchando
echo "1️⃣ Verificando si PostgreSQL está escuchando..."
netstat -tlnp 2>/dev/null | grep 5432 || ss -tlnp 2>/dev/null | grep 5432 || echo "   No se pudo verificar con netstat/ss"

echo ""
echo "2️⃣ Verificando contenedores..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(postgres|supabase)" || echo "   No se encontraron contenedores PostgreSQL"

echo ""
echo "3️⃣ Probando conexión local..."
timeout 3 bash -c "</dev/tcp/localhost/5432" 2>/dev/null && echo "   ✅ Puerto 5432 abierto en localhost" || echo "   ❌ Puerto 5432 cerrado en localhost"

echo ""
echo "4️⃣ Probando conexión desde IP pública..."
timeout 3 bash -c "</dev/tcp/80.225.188.223/5432" 2>/dev/null && echo "   ✅ Puerto 5432 abierto en IP pública" || echo "   ❌ Puerto 5432 cerrado en IP pública (firewall)"

echo ""
echo "5️⃣ Verificando IP del contenedor PostgreSQL..."
PG_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i postgres | head -1)
if [ -n "$PG_CONTAINER" ]; then
    echo "   Contenedor encontrado: $PG_CONTAINER"
    PG_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $PG_CONTAINER 2>/dev/null)
    if [ -n "$PG_IP" ]; then
        echo "   IP del contenedor: $PG_IP"
        echo "   Probando conexión..."
        timeout 3 bash -c "</dev/tcp/$PG_IP/5432" 2>/dev/null && echo "   ✅ Conexión exitosa a contenedor" || echo "   ❌ No se puede conectar a contenedor"
    fi
else
    echo "   No se encontró contenedor PostgreSQL"
fi

echo ""
echo "📋 RESUMEN:"
echo "==========="
echo ""
echo "Para conectar desde admin-dseo en Coolify, necesitas:"
echo ""
echo "OPCIÓN 1 - Usar nombre del contenedor (dentro de la red Docker):"
echo "   DB_HOST: supabase-db  (o el nombre del servicio en docker-compose)"
echo ""
echo "OPCIÓN 2 - Usar IP interna del contenedor:"
if [ -n "$PG_IP" ]; then
    echo "   DB_HOST: $PG_IP"
else
    echo "   (Obtener con: docker inspect [contenedor] | grep IPAddress)"
fi
echo ""
echo "OPCIÓN 3 - Exponer PostgreSQL públicamente (menos seguro):"
echo "   Abrir puerto 5432 en el firewall y usar:"
echo "   DB_HOST: 80.225.188.223"
echo ""
echo "💡 RECOMENDACIÓN: Usar OPCIÓN 1 o 2 (más seguro)"
