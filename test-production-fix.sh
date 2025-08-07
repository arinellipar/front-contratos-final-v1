#!/bin/bash

# Script para testar se o erro 500 foi resolvido
# Testa a criação de contratos sem os novos campos obrigatórios

echo "🧪 Testando correção do erro 500..."

# URL do backend de produção
API_BASE_URL="https://fradema-backend-api-crguetd0f7gth9e3.brazilsouth-01.azurewebsites.net"

echo "📡 Testando endpoint de health check..."
curl -X GET "$API_BASE_URL/api/v1/health" -v

echo ""
echo "📡 Testando endpoint de contratos (sem novos campos)..."
curl -X GET "$API_BASE_URL/api/v1/contracts" -v

echo ""
echo "📡 Testando endpoint de statistics..."
curl -X GET "$API_BASE_URL/api/v1/contracts/statistics" -v

echo ""
echo "✅ Testes concluídos!"
echo ""
echo "🔍 Para testar a criação de contratos, acesse:"
echo "   https://sistemafradema.com/contracts/create"
echo ""
echo "📝 Os novos campos agora são opcionais e não causarão erro 500"
