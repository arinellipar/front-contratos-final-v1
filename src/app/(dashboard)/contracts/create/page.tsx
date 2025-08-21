"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { ContractForm } from "@/components/contracts/ContractForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { motion, useInView } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Shield,
  Users,
  Target,
  Briefcase,
  Plus,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  Building,
  DollarSign,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Modern 2025 animation variants for enterprise consulting
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  hover: {
    y: -4,
    scale: 1.01,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function CreateContractPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={containerRef}
      variants={pageVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-navy-50/30"
    >
      <div className="relative">
        {/* Sophisticated background pattern */}
        <div className="absolute inset-0 bg-grid-navy-100/20 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-gradient-to-br from-navy-100/30 to-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-gradient-to-br from-indigo-100/30 to-navy-200/20 rounded-full blur-3xl" />

        <div className="relative space-y-8 p-6 pl-6 md:pl-12 lg:pl-16 max-w-6xl mx-auto">
          {/* Modern Executive Header */}
          <motion.div
            variants={cardVariants}
            className="glass-morphism-strong rounded-3xl p-8 border border-navy-100/50 shadow-xl"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <Plus className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <motion.h1
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-4xl font-bold bg-gradient-to-r from-navy-900 to-emerald-700 bg-clip-text text-transparent"
                    >
                      Novo Contrato
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-lg text-navy-600 font-medium"
                    >
                      Consultoria Tributária Empresarial • Criação de Acordo
                    </motion.p>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center space-x-6 text-sm"
                >
                  <div className="flex items-center space-x-2 text-navy-600">
                    <Shield className="w-4 h-4" />
                    <span>Compliance Legal</span>
                  </div>
                  <div className="flex items-center space-x-2 text-navy-600">
                    <Scale className="w-4 h-4" />
                    <span>Validação Jurídica</span>
                  </div>
                  <div className="flex items-center space-x-2 text-navy-600">
                    <Target className="w-4 h-4" />
                    <span>Gestão Fiscal</span>
                  </div>
                </motion.div>
              </div>

              {/* Navigation Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center gap-3"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => router.back()}
                    variant="ghost"
                    className="bg-white/60 hover:bg-white/80 border border-navy-200/50 text-navy-700 backdrop-blur-sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => router.push("/contracts")}
                    variant="ghost"
                    className="bg-white/60 hover:bg-white/80 border border-navy-200/50 text-navy-700 backdrop-blur-sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Contratos
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Process Steps Indicator */}
          <motion.div
            variants={cardVariants}
            className="glass-morphism rounded-2xl p-6 border border-navy-100/50 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-navy-900">
                Processo de Criação
              </h3>
              <div className="flex items-center space-x-2 text-xs text-navy-600">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Passo 1 de 3</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                variants={stepVariants}
                className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200/50"
              >
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    Dados Básicos
                  </p>
                  <p className="text-xs text-emerald-700">
                    Informações do contrato
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={stepVariants}
                className="flex items-center space-x-3 p-3 bg-navy-25 rounded-xl border border-navy-100/50"
              >
                <div className="w-8 h-8 bg-navy-200 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-navy-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-700">
                    Valores & Pagamento
                  </p>
                  <p className="text-xs text-navy-600">Condições financeiras</p>
                </div>
              </motion.div>

              <motion.div
                variants={stepVariants}
                className="flex items-center space-x-3 p-3 bg-navy-25 rounded-xl border border-navy-100/50"
              >
                <div className="w-8 h-8 bg-navy-200 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-navy-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-700">
                    Revisão & Criação
                  </p>
                  <p className="text-xs text-navy-600">Validação final</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Important Guidelines */}
          <motion.div
            variants={cardVariants}
            className="glass-morphism rounded-2xl p-6 border border-blue-200/50 bg-blue-50/30 shadow-lg"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-blue-900 mb-2">
                  📋 Diretrizes Importantes
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div className="space-y-2">
                    <p className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>
                        Preencha todos os campos obrigatórios marcados com *
                      </span>
                    </p>
                    <p className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>
                        Valores monetários são formatados automaticamente
                      </span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>Verifique as datas de vigência do contrato</span>
                    </p>
                    <p className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>Anexe o PDF do contrato quando disponível</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Contract Form */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="glass-morphism-strong rounded-2xl border border-navy-100/50 shadow-xl overflow-hidden"
          >
            <div className="p-6 bg-gradient-to-r from-navy-50/50 to-transparent border-b border-navy-100/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-navy-600 to-navy-700 rounded-2xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-navy-900">
                    Formulário de Contrato
                  </h3>
                  <p className="text-sm text-navy-600 font-medium">
                    Complete as informações abaixo para criar o novo contrato
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="relative">
                {/* Enhanced gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-navy-25/5 pointer-events-none" />
                <ContractForm />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
