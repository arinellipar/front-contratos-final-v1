"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { contractsApi } from "@/lib/api/contracts";
import { PageHeader } from "@/components/layout/Pageheader";
import { ContractForm } from "@/components/contracts/ContractForm";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function EditContractPage() {
  const params = useParams();
  const contractId = parseInt(params.id as string);

  const {
    data: contract,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["contract", contractId],
    queryFn: () => contractsApi.getById(contractId),
    enabled: !!contractId && !isNaN(contractId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Erro"
          description="Não foi possível carregar o contrato"
        />
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">
              Contrato não encontrado ou erro ao carregar dados.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Convert contract data to form format
  const contractData = contract as any;
  console.log("🔍 Contract data received for editing:", contractData);
  console.log(
    "🔍 Raw filial value:",
    contractData.filial,
    "type:",
    typeof contractData.filial
  );
  console.log(
    "🔍 Raw tipoPagamento value:",
    contractData.tipoPagamento,
    "type:",
    typeof contractData.tipoPagamento
  );
  console.log(
    "🔍 Raw formaPagamento value:",
    contractData.formaPagamento,
    "type:",
    typeof contractData.formaPagamento
  );

  // Helper function to safely parse numbers
  const parseToNumber = (value: any, fallback: number): number => {
    if (typeof value === "number" && !isNaN(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = parseInt(value, 10);
      return !isNaN(parsed) ? parsed : fallback;
    }
    return fallback;
  };

  const initialData = {
    contrato: contract.contrato,
    contratante: contract.contratante,
    contratada: contract.contratada,
    objeto: contract.objeto,
    dataContrato: new Date(contract.dataContrato).toISOString().split("T")[0],
    prazo: contract.prazo.toString(),
    rescisao: contract.rescisao?.toString(),
    multa: contract.multa?.toString(),
    avisoPrevia: contract.avisoPrevia?.toString(),
    observacoes: contract.observacoes,
    filial: contractData.filial || contract.filial || 1,
    categoriaContrato: contract.categoriaContrato,
    setorResponsavel: contractData.setorResponsavel || "",
    valorTotalContrato: contractData.valorTotalContrato
      ? Math.round(contractData.valorTotalContrato * 100).toString()
      : "",
    tipoPagamento: contractData.tipoPagamento || contract.tipoPagamento || 1,
    quantidadeParcelas: contractData.quantidadeParcelas?.toString(),
    formaPagamento: contractData.formaPagamento || contract.formaPagamento || 1,
    dataFinal: contractData.dataFinal
      ? new Date(contractData.dataFinal).toISOString().split("T")[0]
      : new Date(
          new Date(contract.dataContrato).getTime() +
            contract.prazo * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
  };

  console.log("📝 Initial data formatted for form:", initialData);
  console.log("🔍 Campos específicos check:");
  console.log(
    "  - valorTotalContrato:",
    contractData.valorTotalContrato,
    "->",
    initialData.valorTotalContrato
  );
  console.log(
    "  - tipoPagamento:",
    contractData.tipoPagamento,
    "->",
    initialData.tipoPagamento
  );
  console.log(
    "  - formaPagamento:",
    contractData.formaPagamento,
    "->",
    initialData.formaPagamento
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar Contrato #${contract.id}`}
        description={`${contract.contratante} - ${contract.objeto}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Contratos", href: "/dashboard" },
          {
            label: `Contrato #${contract.id}`,
            href: `/dashboard/${contract.id}`,
          },
          { label: "Editar" },
        ]}
      />

      <Card>
        <CardContent className="p-6">
          <ContractForm initialData={initialData} contractId={contractId} />
        </CardContent>
      </Card>
    </div>
  );
}
