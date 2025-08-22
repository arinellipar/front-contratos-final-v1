"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { contractsApi } from "@/lib/api/contracts";
import { PageHeader } from "@/components/layout/Pageheader";
import { ContractForm } from "@/components/contracts/ContractForm";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Filial, TipoPagamento, FormaPagamento } from "@/lib/types/contract";

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

  const coerceEnumNumber = (
    val: any,
    enumObj: any,
    fallback: number
  ): number => {
    if (typeof val === "number" && Number.isFinite(val)) return val;
    if (typeof val === "string" && val !== "") {
      const n = Number(val);
      if (Number.isFinite(n)) return n;
      const mapped = (enumObj as any)[val as keyof typeof enumObj];
      if (typeof mapped === "number") return mapped as number;
    }
    return fallback;
  };

  // Convert contract data to form format
  console.log("🔴🔴🔴 CONTRACT DATA FROM API:", contract);
  console.log("🔴🔴🔴 MULTA FROM API:", contract.multa);

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
    filial: coerceEnumNumber(
      (contract as any).filial,
      Filial,
      Filial.RioDeJaneiro
    ),
    categoriaContrato: contract.categoriaContrato,
    setorResponsavel: contract.setorResponsavel || "",
    valorTotalContrato: contract.valorTotalContrato
      ? (contract.valorTotalContrato * 100).toString().replace(/\D/g, "")
      : "",
    tipoPagamento: coerceEnumNumber(
      (contract as any).tipoPagamento,
      TipoPagamento,
      TipoPagamento.AVista
    ),
    quantidadeParcelas: contract.quantidadeParcelas?.toString(),
    formaPagamento: coerceEnumNumber(
      (contract as any).formaPagamento,
      FormaPagamento,
      FormaPagamento.Pix
    ),
    dataFinal: contract.dataFinal
      ? new Date(contract.dataFinal).toISOString().split("T")[0]
      : new Date(
          new Date(contract.dataContrato).getTime() +
            contract.prazo * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
  };

  if (contract.id === 1) {
    console.log("[EditContractPage] Coerced initialData for contract 1:", {
      filial: initialData.filial,
      tipoPagamento: initialData.tipoPagamento,
      formaPagamento: initialData.formaPagamento,
    });
  }

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
