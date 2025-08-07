#!/bin/bash

# Script para testar se o erro 500 foi resolvido
# Testa os endpoints que estavam falhando

echo "🧪 Testando correção do erro 500..."

# URL do backend de produção
API_BASE_URL="https://fradema-backend-api-crguetd0f7gth9e3.brazilsouth-01.azurewebsites.net"

echo "📡 Testando endpoint de contratos (GET)..."
curl -X GET "$API_BASE_URL/api/v1/contracts" -v

echo ""
echo "📡 Testando endpoint de statistics (GET)..."
curl -X GET "$API_BASE_URL/api/v1/contracts/statistics" -v

echo ""
echo "✅ Testes concluídos!"
echo ""
echo "🔍 Para testar a aplicação, acesse:"
echo "   https://sistemafradema.com/contracts"
echo ""
echo "📝 Agora o frontend deve:"
echo "   - Não crashar com erro 500"
echo "   - Mostrar dados vazios se backend não responder"
echo "   - Exibir mensagens de warning no console"
