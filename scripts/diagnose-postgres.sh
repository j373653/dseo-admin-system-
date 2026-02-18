#!/bin/bash

echo "🔍 DIAGNÓSTICO DE CONECTIVIDAD POSTGRESQL"
echo "=========================================="
echo ""

# Verificar si estamos en el VPS
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no encontrado. Este script debe ejecutarse en el VPS."
    exit 1
fi

echo "📋 Contenedores Docker activos:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(supabase|postgres|n8n)"

echo ""
echo "🌐 Redes Docker disponibles:"
docker network ls | grep -E "(supabase|coolify|bridge)"

echo ""
echo "🔎 Buscando contenedor de PostgreSQL..."
POSTGRES_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i postgres | head -1)

if [ -n "$POSTGRES_CONTAINER" ]; then
    echo "✅ Contenedor PostgreSQL encontrado: $POSTGRES_CONTAINER"
    echo ""
    echo "📍 IP del contenedor PostgreSQL:"
    docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $POSTGRES_CONTAINER 2>/dev/null || echo "❌ No se pudo obtener IP"
    echo ""
    echo "🔗 Probando conexión desde el host..."
    POSTGRES_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $POSTGRES_CONTAINER 2>/dev/null)
    if [ -n "$POSTGRES_IP" ]; then
        echo "   IP: $POSTGRES_IP"
        echo "   Puerto 5432:"
        timeout 3 bash -c "</dev/tcp/$POSTGRES_IP/5432" 2>/dev/null && echo "   ✅ Puerto 5432 abierto" || echo "   ❌ Puerto 5432 cerrado/inaccesible"
    fi
else
    echo "❌ No se encontró contenedor PostgreSQL"
fi

echo ""
echo "📝 RECOMENDACIONES:"
echo "==================="
echo ""
echo "OPCIÓN 1 - Usar IP del contenedor (recomendada):"
if [ -n "$POSTGRES_IP" ]; then
    echo "   Host: $POSTGRES_IP"
    echo "   Port: 5432"
fi
echo ""
echo "OPCIÓN 2 - Exponer PostgreSQL al host:"
echo "   Ve a Coolify → Servicio Supabase → Ports"
echo "   Asegúrate de que el puerto 5432 esté mapeado: 5432:5432"
echo "   Luego usa:"
echo "   Host: localhost (o IP del VPS: 80.225.188.223)"
echo "   Port: 5432"
echo ""
echo "OPCIÓN 3 - Misma red Docker:"
echo "   Configura n8n y Supabase para usar la misma red en Coolify"
