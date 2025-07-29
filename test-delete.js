// Teste simples para verificar se a API de exclusão está funcionando
const API_URL =
  "https://fradema-backend-api-crguetd0f7gth9e3.brazilsouth-01.azurewebsites.net/api/v1";

async function testDelete() {
  try {
    console.log("🔍 Testando API de exclusão...");

    // Primeiro, vamos buscar alguns contratos para ver se a API está funcionando
    const response = await fetch(`${API_URL}/contracts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contracts = await response.json();
    console.log("✅ API de contratos está funcionando");
    console.log("📊 Contratos encontrados:", contracts.data?.length || 0);

    if (contracts.data && contracts.data.length > 0) {
      const firstContract = contracts.data[0];
      console.log("🔍 Primeiro contrato:", {
        id: firstContract.id,
        contrato: firstContract.contrato,
        contratante: firstContract.contratante,
      });

      // Agora vamos testar a exclusão (comentado para segurança)
      console.log("⚠️ Teste de exclusão comentado por segurança");
      /*
      const deleteResponse = await fetch(`${API_URL}/contracts/${firstContract.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (deleteResponse.ok) {
        console.log("✅ API de exclusão está funcionando");
      } else {
        console.error("❌ Erro na API de exclusão:", deleteResponse.status, deleteResponse.statusText);
      }
      */
    }
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

// Executar o teste
testDelete();
