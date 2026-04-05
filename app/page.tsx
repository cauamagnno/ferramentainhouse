"use client"

import { useState, useMemo, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Settings, Download, Store, Wrench, PieChart, PlusCircle, Building2, Building, Hotel, Dumbbell, Plus, Trash2, MonitorPlay, CalendarDays, TrendingUp, CreditCard, Box, Package, Banknote, Laptop, GraduationCap, Megaphone } from "lucide-react"
import domtoimage from "dom-to-image-more"
import jsPDF from "jspdf"

const formatCurrency = (value: number) => {
  if (value === undefined || value === null || isNaN(value)) {
    return "R$ 0,00"
  }
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function InHouseCalculator() {
  const slideRef = useRef<HTMLDivElement>(null)

  const downloadPDF = async () => {
    if (!clienteName || !vendedorName) {
      alert("Por favor, preencha o Nome do Cliente e o Nome do Consultor na aba 'Proposta PDF' antes de gerar o documento.")
      return
    }
    if (!slideRef.current) return
    try {
      const element = slideRef.current
      const width = 1280
      const totalHeight = element.scrollHeight
      const pageHeightPx = 1810 // Altura proporcional a 1280px para manter proporção A4

      const imgData = await domtoimage.toPng(element, {
        width: width,
        height: totalHeight,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          margin: "0",
          backgroundColor: "#0a0a0a"
        }
      })

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [width, pageHeightPx]
      })

      let heightLeft = totalHeight
      let position = 0

      // Adiciona a primeira página
      pdf.addImage(imgData, "PNG", 0, position, width, totalHeight)
      heightLeft -= pageHeightPx

      // Loop para adicionar novas páginas enquanto houver conteúdo
      while (heightLeft > 0) {
        position = position - pageHeightPx
        pdf.addPage([width, pageHeightPx], "p")
        pdf.addImage(imgData, "PNG", 0, position, width, totalHeight)
        heightLeft -= pageHeightPx
      }

      pdf.save(`proposta_inhouse_${clienteName.replace(/\s+/g, "_").toLowerCase()}.pdf`)
    } catch (error) {
      console.error("Erro na geração de captura:", error)
      alert("Ocorreu um error ao gerar o PDF. Acesse o console log para detalhes.")
    }
  }
  const [activeTab, setActiveTab] = useState("investimento")
  const [clienteName, setClienteName] = useState("")
  const [vendedorName, setVendedorName] = useState("")

  const [numLojas, setNumLojas] = useState(1)
  const [pagamentoLicenca, setPagamentoLicenca] = useState<"vista" | "50-10x" | "20-10x" | "30-10x">("vista")
  const [dividirCartoes, setDividirCartoes] = useState(false)
  const [pagamentoMontagem, setPagamentoMontagem] = useState("vista")
  const [ticketCompra, setTicketCompra] = useState(500)
  const [numApartamentos, setNumApartamentos] = useState(300)
  const [parcelasMontagem, setParcelasMontagem] = useState(1) // Estado adicionado para o número de parcelas de montagem

  const [equipamentosAdicionais, setEquipamentosAdicionais] = useState<
    Array<{ nome: string; valor: number; quantidade: number }>
  >([])
  const [novoEquipamento, setNovoEquipamento] = useState({ nome: "", valor: 0, quantidade: 1 })

  const [tempoMaturacao, setTempoMaturacao] = useState(3) // meses para atingir 100% do faturamento
  const [inauguracaoCascateada, setInauguracaoCascateada] = useState(false)
  const [intervaloSegundaLoja, setIntervaloSegundaLoja] = useState(60) // dias
  const [intervaloTerceiraLoja, setIntervaloTerceiraLoja] = useState(90) // dias
  const [projecaoHabilitada, setProjecaoHabilitada] = useState(false)

  const [percentualRepasse, setPercentualRepasse] = useState(3)

  const [dreConfigs, setDreConfigs] = useState({
    cmv: { tipo: 'percentual', valor: 57 },
    taxasBancarias: { tipo: 'percentual', valor: 1.4 },
    internet: { tipo: 'fixo', valor: 99.9 },
    energia: { tipo: 'fixo', valor: 433.27 },
    limpeza: { tipo: 'fixo', valor: 150 },
    mensalidadeInhouse: { tipo: 'percentual', valor: 6 },
    das: { tipo: 'fixo', valor: 76.0 },
    perdaEstoque: { tipo: 'percentual', valor: 3 },
    despesasContabeis: { tipo: 'percentual', valor: 0.9 },
    manutencaoLoja: { tipo: 'percentual', valor: 0.5 },
    veiculosCombustivel: { tipo: 'percentual', valor: 1.5 },
  })

  const handleDreConfigChange = (key: string, value: number) => {
    setDreConfigs(prev => ({
      ...prev,
      [key]: { ...prev[key as keyof typeof dreConfigs], valor: value }
    }))
  }


  const [dataInicioPagamento, setDataInicioPagamento] = useState<string>(() => {
    const hoje = new Date()
    const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
    return proximoMes.toISOString().split("T")[0]
  })

  const calcularParcelaComJuros = (valorTotal: number, parcelas: number, taxaJuros: number): number => {
    const taxa = taxaJuros / 100
    return (valorTotal * taxa * Math.pow(1 + taxa, parcelas)) / (Math.pow(1 + taxa, parcelas) - 1)
  }

  const calcularParcelaMontagem = (valorTotal: number, parcelas: number): number => {
    if (parcelas <= 10) {
      // Até 10x sem juros
      return valorTotal / parcelas
    } else {
      // Acima de 10x com juros de 3,99% ao mês
      return calcularParcelaComJuros(valorTotal, parcelas, 3.99)
    }
  }

  const valorMontagemBase = 24000 * numLojas
  const valorEquipamentosAdicionais = useMemo(
    () => equipamentosAdicionais.reduce((total, eq) => total + eq.valor * eq.quantidade, 0),
    [equipamentosAdicionais],
  )
  const valorMontagemTotal = valorMontagemBase + valorEquipamentosAdicionais

  const investimentoTotal = useMemo(() => {
    const valorLicenca = 16000 + (numLojas - 1) * 6000
    return valorLicenca + valorMontagemTotal
  }, [numLojas, valorMontagemTotal])

  const adicionarEquipamento = () => {
    if (novoEquipamento.nome && novoEquipamento.valor > 0) {
      setEquipamentosAdicionais([...equipamentosAdicionais, { ...novoEquipamento }])
      setNovoEquipamento({ nome: "", valor: 0, quantidade: 1 })
    }
  }

  const removerEquipamento = (index: number) => {
    setEquipamentosAdicionais(equipamentosAdicionais.filter((_, i) => i !== index))
  }

  const calcularFaturamentoComMaturacao = (mes: number, lojaIndex: number) => {
    const faturamentoPorLoja = ticketCompra * numApartamentos

    if (!projecaoHabilitada) {
      return faturamentoPorLoja
    }

    let mesInicioLoja = 1
    if (inauguracaoCascateada && lojaIndex > 0) {
      if (lojaIndex === 1) {
        mesInicioLoja = Math.ceil(intervaloSegundaLoja / 30)
      } else if (lojaIndex === 2) {
        mesInicioLoja = Math.ceil(intervaloTerceiraLoja / 30)
      }
    }

    if (mes < mesInicioLoja) {
      return 0 // Loja ainda não inaugurada
    }

    const mesOperacao = mes - mesInicioLoja + 1
    if (mesOperacao <= tempoMaturacao) {
      // Crescimento gradual até 100%
      const percentualMaturacao = mesOperacao / tempoMaturacao
      return faturamentoPorLoja * percentualMaturacao
    }

    return faturamentoPorLoja // 100% após maturação
  }

  const calcularDREComProjecao = (mes: number) => {
    let faturamentoTotal = 0

    for (let i = 0; i < numLojas; i++) {
      faturamentoTotal += calcularFaturamentoComMaturacao(mes, i)
    }

    const cmv = faturamentoTotal * (dreConfigs.cmv.valor / 100)
    const lucrobruto = faturamentoTotal - cmv

    // Custos fixos proporcionais às lojas ativas
    const lojasAtivas = projecaoHabilitada
      ? Array.from({ length: numLojas }, (_, i) => {
          let mesInicioLoja = 1
          if (inauguracaoCascateada && i > 0) {
            if (i === 1) mesInicioLoja = Math.ceil(intervaloSegundaLoja / 30)
            else if (i === 2) mesInicioLoja = Math.ceil(intervaloTerceiraLoja / 30)
          }
          return mes >= mesInicioLoja ? 1 : 0
        }).reduce((a, b) => a + b, 0)
      : numLojas

    const taxasBancarias = faturamentoTotal * (dreConfigs.taxasBancarias.valor / 100)
    const internet = dreConfigs.internet.valor * lojasAtivas
    const energia = dreConfigs.energia.valor * lojasAtivas
    const limpeza = dreConfigs.limpeza.valor * lojasAtivas // added limpeza here for alignment
    const repasse = faturamentoTotal * (percentualRepasse / 100)
    const mensalidadeInhouse = faturamentoTotal > 250 ? faturamentoTotal * (dreConfigs.mensalidadeInhouse.valor / 100) : 0
    const das = dreConfigs.das.valor * lojasAtivas
    const perdaEstoque = faturamentoTotal * (dreConfigs.perdaEstoque.valor / 100)
    const despesasContabeis = faturamentoTotal * (dreConfigs.despesasContabeis.valor / 100)
    const manutencaoLoja = faturamentoTotal * (dreConfigs.manutencaoLoja.valor / 100)
    const veiculosCombustivel = faturamentoTotal * (dreConfigs.veiculosCombustivel.valor / 100)

    const custosFixos =
      taxasBancarias +
      internet +
      energia +
      limpeza +
      repasse +
      mensalidadeInhouse +
      das +
      perdaEstoque +
      despesasContabeis +
      manutencaoLoja +
      veiculosCombustivel
    const lucroLiquido = lucrobruto - custosFixos

    return {
      faturamentoMensal: faturamentoTotal,
      custoVariavel: cmv,
      margemContribuicao: lucrobruto,
      custosFixos,
      lucroLiquido,
      lojasAtivas,
      taxasBancarias,
      internet,
      energia,
      limpeza,
      repasse,
      mensalidadeInhouse,
      das,
      perdaEstoque,
      despesasContabeis,
      manutencaoLoja,
      veiculosCombustivel,
    }
  }

  const dreData = useMemo(() => {
    if (projecaoHabilitada) {
      // Retorna dados do primeiro mês para exibição padrão
      return calcularDREComProjecao(1)
    }

    // Cálculo original sem projeção
    const faturamentoPorLoja = ticketCompra * numApartamentos
    const faturamentoMensal = faturamentoPorLoja * numLojas
    const cmv = faturamentoMensal * (dreConfigs.cmv.valor / 100)
    const lucrobruto = faturamentoMensal - cmv

    const taxasBancarias = faturamentoMensal * (dreConfigs.taxasBancarias.valor / 100)
    const internet = dreConfigs.internet.valor * numLojas
    const energia = dreConfigs.energia.valor * numLojas
    const limpeza = dreConfigs.limpeza.valor * numLojas
    const repasse = faturamentoMensal * (percentualRepasse / 100)
    const mensalidadeInhouse = faturamentoMensal > 250 ? faturamentoMensal * (dreConfigs.mensalidadeInhouse.valor / 100) : 0
    const das = dreConfigs.das.valor * numLojas
    const perdaEstoque = faturamentoMensal * (dreConfigs.perdaEstoque.valor / 100)
    const despesasContabeis = faturamentoMensal * (dreConfigs.despesasContabeis.valor / 100)
    const manutencaoLoja = faturamentoMensal * (dreConfigs.manutencaoLoja.valor / 100)
    const veiculosCombustivel = faturamentoMensal * (dreConfigs.veiculosCombustivel.valor / 100)

    const custosFixos =
      taxasBancarias +
      internet +
      energia +
      limpeza +
      limpeza +
      repasse +
      mensalidadeInhouse +
      das +
      perdaEstoque +
      despesasContabeis +
      manutencaoLoja +
      veiculosCombustivel
    const lucroLiquido = lucrobruto - custosFixos

    const payback = investimentoTotal / lucroLiquido
    const roiAnual = lucroLiquido > 0 ? ((lucroLiquido * 12) / investimentoTotal) * 100 : 0

    return {
      faturamentoMensal,
      custoVariavel: cmv,
      margemContribuicao: lucrobruto,
      custosFixos,
      lucroLiquido,
      payback,
      roiAnual,
      taxasBancarias,
      internet,
      energia,
      limpeza,
      repasse,
      mensalidadeInhouse,
      das,
      perdaEstoque,
      despesasContabeis,
      manutencaoLoja,
      veiculosCombustivel,
    }
  }, [
    numLojas,
    ticketCompra,
    numApartamentos,
    investimentoTotal, // Changed from calculationData to investimentoTotal
    projecaoHabilitada,
    tempoMaturacao,
    inauguracaoCascateada,
    intervaloSegundaLoja,
    intervaloTerceiraLoja,
    percentualRepasse,
  ])

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-[#0a0a0a] to-[#0a0a0a] text-gray-200 relative overflow-hidden">
      {/* Background ambient blobs for glassmorphism */}
      <div className="absolute top-[-10%] left-[-10%] w-[30%] h-[30%] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[-10%] w-[20%] h-[40%] bg-orange-800/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-2 sm:px-4 py-8 sm:py-12 max-w-7xl relative z-10">
        <div className="text-center mb-10 sm:mb-16 flex flex-col items-center justify-center">
          <img 
            src="https://tqiqnxkncezmzublpdxg.supabase.co/storage/v1/object/public/img/logoinhouse.png" 
            alt="InHouse Logo" 
            className="h-14 sm:h-20 mb-6 drop-shadow-[0_0_15px_rgba(249,115,22,0.2)] filter brightness-110" 
          />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 mb-4 tracking-tight drop-shadow-sm">
            Simulador de Franquia
          </h1>
          <p className="text-sm sm:text-lg text-gray-400 max-w-2xl mx-auto font-light tracking-wide">
            Calcule o investimento, analise a DRE projetada e visualize o retorno financeiro de forma clara.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-8 sm:mb-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] gap-2 relative z-10">
            <TabsTrigger
              value="investimento"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-700 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(249,115,22,0.4)] text-gray-400 hover:text-orange-400 hover:bg-white/5 transition-all duration-300 text-sm sm:text-base font-semibold py-3 px-4 rounded-xl min-h-[60px] flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Banknote className="w-5 h-5" /> Investimento
            </TabsTrigger>
            <TabsTrigger
              value="cronograma"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-700 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(249,115,22,0.4)] text-gray-400 hover:text-orange-400 hover:bg-white/5 transition-all duration-300 text-sm sm:text-base font-semibold py-3 px-4 rounded-xl min-h-[60px] flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <CalendarDays className="w-5 h-5" /> Cronograma
            </TabsTrigger>
            <TabsTrigger
              value="equipamentos"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-700 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(249,115,22,0.4)] text-gray-400 hover:text-orange-400 hover:bg-white/5 transition-all duration-300 text-sm sm:text-base font-semibold py-3 px-4 rounded-xl min-h-[60px] flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Wrench className="w-5 h-5" /> Equipamentos
            </TabsTrigger>
            <TabsTrigger
              value="produtos"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-700 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(249,115,22,0.4)] text-gray-400 hover:text-orange-400 hover:bg-white/5 transition-all duration-300 text-sm sm:text-base font-semibold py-3 px-4 rounded-xl min-h-[60px] flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Package className="w-5 h-5" /> Produtos Inclusos
            </TabsTrigger>
            <TabsTrigger
              value="dre"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-700 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(249,115,22,0.4)] text-gray-400 hover:text-orange-400 hover:bg-white/5 transition-all duration-300 text-sm sm:text-base font-semibold py-3 px-4 rounded-xl min-h-[60px] flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <PieChart className="w-5 h-5" /> DRE & Viabilidade
            </TabsTrigger>
            <TabsTrigger
              value="proposta"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-700 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(249,115,22,0.4)] text-gray-400 hover:text-orange-400 hover:bg-white/5 transition-all duration-300 text-sm sm:text-base font-semibold py-3 px-4 rounded-xl min-h-[60px] flex items-center justify-center gap-2 uppercase tracking-wider border border-orange-500/30"
            >
              <TrendingUp className="w-5 h-5" /> Proposta PDF
            </TabsTrigger>
          </TabsList>

          <TabsContent value="investimento" className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">1</span>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Licenciamento</CardTitle>
                      <CardDescription className="text-orange-100 text-sm">
                        Configure os parâmetros do seu investimento
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="numLojas" className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500/100 rounded-full"></span>
                      Número de lojas
                    </Label>
                    <Input
                      id="numLojas"
                      type="number"
                      min="1"
                      value={numLojas}
                      onChange={(e) => setNumLojas(Number(e.target.value) || 1)}
                      className="h-12 text-lg border-2 border-white/10 focus:border-orange-500 transition-colors"
                      placeholder="Digite o número de lojas"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500/100 rounded-full"></span>
                      Forma de Pagamento - Licença
                    </Label>
                    <div className="space-y-3">
                      <label className="flex items-center p-4 border-2 border-white/10 rounded-xl cursor-pointer hover:border-orange-300 transition-colors">
                        <input
                          type="radio"
                          name="pagamentoLicenca"
                          value="vista"
                          checked={pagamentoLicenca === "vista"}
                          onChange={() => setPagamentoLicenca("vista")}
                          className="w-5 h-5 text-orange-600 mr-4"
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center">
                            <CreditCard className="text-gray-400 w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">À vista</div>
                            <div className="text-sm text-gray-400">Pagamento integral</div>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center p-4 border-2 border-white/10 rounded-xl cursor-pointer hover:border-orange-300 transition-colors">
                        <input
                          type="radio"
                          name="pagamentoLicenca"
                          value="50-10x"
                          checked={pagamentoLicenca === "50-10x"}
                          onChange={() => setPagamentoLicenca("50-10x")}
                          className="w-5 h-5 text-orange-600 mr-4"
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center">
                            <CreditCard className="text-gray-400 w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">50% + 10x no cartão</div>
                            <div className="text-sm text-gray-400">Sem juros</div>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center p-4 border-2 border-white/10 rounded-xl cursor-pointer hover:border-orange-300 transition-colors">
                        <input
                          type="radio"
                          name="pagamentoLicenca"
                          value="20-10x"
                          checked={pagamentoLicenca === "20-10x"}
                          onChange={() => setPagamentoLicenca("20-10x")}
                          className="w-5 h-5 text-orange-600 mr-4"
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center">
                            <CreditCard className="text-gray-400 w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">20% + 10x no cartão</div>
                            <div className="text-sm text-gray-400">Sem juros</div>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center p-4 border-2 border-white/10 rounded-xl cursor-pointer hover:border-orange-300 transition-colors">
                        <input
                          type="radio"
                          name="pagamentoLicenca"
                          value="30-10x"
                          checked={pagamentoLicenca === "30-10x"}
                          onChange={() => setPagamentoLicenca("30-10x")}
                          className="w-5 h-5 text-orange-600 mr-4"
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center">
                            <CreditCard className="text-gray-400 w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">30% + 10x com juros</div>
                            <div className="text-sm text-gray-400">Juros de 3,99% a.m.</div>
                          </div>
                        </div>
                      </label>
                    </div>

                    {(pagamentoLicenca === "50-10x" || pagamentoLicenca === "20-10x") && (
                      <div className="mt-4 p-4 bg-white/5 border-2 border-white/20 rounded-xl relative overflow-hidden">
                        <label className="flex items-center cursor-pointer relative z-10">
                          <input
                            type="checkbox"
                            checked={dividirCartoes}
                            onChange={(e) => setDividirCartoes(e.target.checked)}
                            className="w-5 h-5 text-orange-600 mr-4 rounded border-white/20 bg-transparent focus:ring-orange-500"
                          />
                          <div>
                            <div className="font-semibold text-white">Dividir parcelas em 2 cartões</div>
                            <div className="text-sm text-gray-400">
                              Divida as parcelas igualmente entre dois cartões de crédito simultaneamente
                            </div>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">2</span>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Montagem da Loja</CardTitle>
                      <CardDescription className="text-orange-100 text-sm">
                        Escolha a forma de pagamento da montagem
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="pagamentoMontagem"
                      className="text-sm font-semibold text-gray-200 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 bg-orange-500/100 rounded-full"></span>
                      Forma de Pagamento
                    </Label>
                    <Select value={pagamentoMontagem} onValueChange={setPagamentoMontagem}>
                      <SelectTrigger className="h-12 text-lg border-2 border-white/10 focus:border-orange-500 bg-white/5 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vista">À vista</SelectItem>
                        <SelectItem value="6x">6x sem juros</SelectItem>
                        <SelectItem value="10x">10x sem juros</SelectItem>
                        <SelectItem value="12x">12x com juros 3,99% a.m.</SelectItem>
                        <SelectItem value="15x">15x com juros 3,99% a.m.</SelectItem>
                        <SelectItem value="18x">18x com juros 3,99% a.m.</SelectItem>
                        <SelectItem value="21x">21x com juros 3,99% a.m.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="border border-white/10 shadow-lg bg-white/5 backdrop-blur-md overflow-hidden hover:bg-white/10 transition-colors">
                <CardHeader className="pb-3 relative">
                  <div className="absolute top-4 right-4 w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/20">
                    <Store className="text-orange-500 w-5 h-5" />
                  </div>
                  <CardTitle className="text-white text-sm font-bold tracking-wider uppercase">Fase 1 - Licenciamento</CardTitle>
                  <div className="text-3xl font-light text-orange-400 mt-2">
                    {formatCurrency(16000 + (numLojas - 1) * 6000)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Taxa de licenciamento</span>
                    <span className="font-semibold text-gray-200">Incluso</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Treinamento completo</span>
                    <span className="font-semibold text-gray-200">Incluso</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacitação da equipe</span>
                    <span className="font-semibold text-gray-200">Incluso</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pesquisa de condomínios</span>
                    <span className="font-semibold text-gray-200">Incluso</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gerente de expansão</span>
                    <span className="font-semibold text-gray-200">Incluso</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Manual operacional</span>
                    <span className="font-semibold text-gray-200">Incluso</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Marca e identidade visual</span>
                    <span className="font-semibold text-gray-200">Incluso</span>
                  </div>
                  <hr className="border-white/10 my-2" />
                  <div className="flex justify-between font-bold text-gray-300">
                    <span>Total por loja adicional</span>
                    <span className="text-orange-400">R$ 6.000</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-white/10 shadow-lg bg-white/5 backdrop-blur-md overflow-hidden hover:bg-white/10 transition-colors">
                <CardHeader className="pb-3 relative">
                  <div className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                    <Wrench className="text-white w-5 h-5" />
                  </div>
                  <CardTitle className="text-white text-sm font-bold tracking-wider uppercase">Fase 2 - Equipamentos</CardTitle>
                  <div className="text-3xl font-light text-white mt-2">{formatCurrency(24000 * numLojas)}</div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>02 Refrigeradores expositores</span>
                    <span className="font-semibold text-gray-200">R$ 9.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>02 Gôndolas</span>
                    <span className="font-semibold text-gray-200">R$ 2.500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estoque inicial</span>
                    <span className="font-semibold text-gray-200">R$ 4.500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comunicação visual</span>
                    <span className="font-semibold text-gray-200">R$ 3.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Instalação</span>
                    <span className="font-semibold text-gray-200">R$ 4.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inauguração</span>
                    <span className="font-semibold text-gray-200">R$ 1.000</span>
                  </div>
                  <hr className="border-white/10 my-2" />
                  <div className="flex justify-between font-bold text-gray-300 mt-auto pt-7">
                    <span>Total Montagem</span>
                    <span className="text-white">R$ 24.000</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-white/10 shadow-lg bg-white/5 backdrop-blur-md overflow-hidden hover:bg-white/10 transition-colors">
                <CardHeader className="pb-3 relative">
                  <div className="absolute top-4 right-4 w-10 h-10 bg-gray-500/20 rounded-xl flex items-center justify-center border border-gray-500/20">
                    <PieChart className="text-gray-300 w-5 h-5" />
                  </div>
                  <CardTitle className="text-white text-sm font-bold tracking-wider uppercase">Mensalidades e Taxas</CardTitle>
                  <div className="text-3xl font-light text-transparent mt-2 select-none">-</div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Royalty (6% faturamento)</span>
                    <span className="font-semibold text-gray-200">Mín. R$ 250</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa PIX APP</span>
                    <span className="font-semibold text-gray-200">0,74%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa cartão crédito</span>
                    <span className="font-semibold text-gray-200">2,27%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de saque</span>
                    <span className="font-semibold text-gray-200">R$ 3,67</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa PIX TOTEM</span>
                    <span className="font-semibold text-gray-200">0,94%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa TOTEM cartão</span>
                    <span className="font-semibold text-gray-200">2,46%</span>
                  </div>
                  <hr className="border-white/10 my-2" />
                  <div className="flex justify-between font-bold text-gray-300">
                    <span>Taxa TOTEM saque</span>
                    <span className="text-white">1,09%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-white/10 shadow-lg bg-white/5 backdrop-blur-md overflow-hidden hover:bg-white/10 transition-colors">
                <CardHeader className="pb-3 relative">
                  <div className="absolute top-4 right-4 w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                    <PlusCircle className="text-gray-400 w-5 h-5" />
                  </div>
                  <CardTitle className="text-white text-sm font-bold tracking-wider uppercase">Opcionais</CardTitle>
                  <div className="text-3xl font-light text-transparent mt-2 select-none">-</div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Máquinas e acessórios</span>
                    <span className="font-semibold text-gray-200">~R$ 1.200</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa ativação/loja</span>
                    <span className="font-semibold text-gray-200">R$ 2.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Upgrade totem (cartões)</span>
                    <span className="font-semibold text-gray-200">Consulte</span>
                  </div>
                  <hr className="border-white/10 my-2" />
                  <div className="flex justify-between font-bold text-gray-300 mt-auto pt-24">
                    <span>Lojas adicionais</span>
                    <span className="text-white">R$ 6.000</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-[#1a1a1a]/40 backdrop-blur-xl overflow-hidden">
              <CardHeader className="bg-[#1a1a1a]/40 backdrop-blur-md border-b">
                <CardTitle className="text-white text-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-500/30">
                    <PieChart className="text-orange-400 w-5 h-5" />
                  </div>
                  Resumo do Investimento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card className="bg-gradient-to-br from-orange-600 via-orange-700 to-orange-800 text-white border-0 shadow-lg relative overflow-hidden">
                    <CardContent className="p-6 text-center z-10 relative">
                      <div className="text-lg font-bold mb-2 flex items-center justify-center gap-3">
                        <Banknote className="w-6 h-6 text-orange-200" />
                        Investimento Total
                      </div>
                      <div className="text-3xl font-bold mb-1">
                        {formatCurrency(16000 + (numLojas - 1) * 6000 + 24000 * numLojas)}
                      </div>
                      <div className="text-sm opacity-90">Soma das duas fases</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 backdrop-blur-sm border-2 border-white/20 shadow-md">
                    <CardContent className="p-6 text-center">
                      <div className="text-lg font-bold mb-2 text-white flex items-center justify-center gap-2">
                        <Store className="w-5 h-5 text-gray-400" />
                        Fase 1 - Licenciamento
                      </div>
                      <div className="text-2xl font-bold text-orange-400 mb-1">
                        {formatCurrency(16000 + (numLojas - 1) * 6000)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {pagamentoLicenca === "vista" ? "À vista" : pagamentoLicenca}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 backdrop-blur-sm border-2 border-white/20 shadow-md">
                    <CardContent className="p-6 text-center">
                      <div className="text-lg font-bold mb-2 text-white flex items-center justify-center gap-2">
                        <Wrench className="w-5 h-5 text-gray-400" />
                        Fase 2 - Montagem
                      </div>
                      <div className="text-2xl font-bold text-orange-400 mb-1">{formatCurrency(24000 * numLojas)}</div>
                      <div className="text-sm text-gray-400">
                        {pagamentoMontagem === "vista" ? "À vista" : pagamentoMontagem}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-orange-500/10 border-l-4 border-orange-500 rounded-lg p-4 border-r border-t border-b border-orange-500/20">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-500/100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="text-sm text-orange-200">
                      <strong className="text-orange-400">Lembre-se:</strong> Primeira licença R$ 16.000, licenças
                      adicionais R$ 6.000 cada. Além do investimento inicial, há mensalidade de 6% sobre o faturamento +
                      taxas bancárias.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cronograma" className="space-y-6">
            <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center">
                    <CalendarDays className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Configuração do Cronograma</CardTitle>
                    <CardDescription className="text-orange-100 text-sm">
                      Defina quando iniciar os pagamentos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="dataInicioPagamento"
                    className="text-sm font-semibold text-gray-200 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 bg-orange-500/100 rounded-full"></span>
                    Data de Início dos Pagamentos
                  </Label>
                  <Input
                    id="dataInicioPagamento"
                    type="date"
                    value={dataInicioPagamento}
                    onChange={(e) => setDataInicioPagamento(e.target.value)}
                    className="h-12 text-lg border-2 border-white/10 focus:border-orange-500 transition-colors"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl overflow-hidden">
              <CardHeader className="bg-[#1a1a1a]/40 backdrop-blur-md border-b">
                <CardTitle className="text-white text-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-500/30">
                    <PieChart className="w-5 h-5 text-orange-400" />
                  </div>
                  Cronograma Detalhado de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead>
                      <tr className="border-b-2 border-white/20 bg-orange-500/10">
                        <th className="text-left py-3 px-4 font-semibold">Fase</th>
                        <th className="text-left py-3 px-4 font-semibold">Parcela</th>
                        <th className="text-right py-3 px-4 font-semibold">Valor</th>
                        {dividirCartoes && (pagamentoLicenca === "50-10x" || pagamentoLicenca === "20-10x") && (
                          <th className="text-right py-3 px-4 font-semibold">Dividido em 2 Cartões</th>
                        )}
                        <th className="text-left py-3 px-4 font-semibold">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const rows = []
                        const valorLicencaBase = 16000 + (numLojas - 1) * 6000

                        // Licenciamento
                        if (pagamentoLicenca === "vista") {
                          rows.push(
                            <tr key="licenca-vista" className="border-b hover:bg-orange-500/10">
                              <td className="py-3 px-4 font-semibold text-white">Licenciamento</td>
                              <td className="py-3 px-4 text-gray-400 font-light italic">À Vista</td>
                              <td className="py-3 px-4 text-right font-bold text-orange-400">
                                {formatCurrency(valorLicencaBase)}
                              </td>
                              {dividirCartoes && (pagamentoLicenca === "50-10x" || pagamentoLicenca === "20-10x") && (
                                <td className="py-3 px-4 text-right">-</td>
                              )}
                              <td className="py-3 px-4">Imediato</td>
                            </tr>,
                          )
                        } else if (pagamentoLicenca === "50-10x") {
                          rows.push(
                            <tr key="licenca-50-3x-entrada" className="border-b hover:bg-orange-500/10">
                              <td className="py-3 px-4 font-semibold text-white">Licenciamento</td>
                              <td className="py-3 px-4 text-gray-400 font-light italic">Entrada (50%)</td>
                              <td className="py-3 px-4 text-right font-bold text-orange-400">
                                {formatCurrency(valorLicencaBase * 0.5)}
                              </td>
                              {dividirCartoes && (
                                <td className="py-3 px-4 text-right text-orange-400/80 italic font-light">
                                  {formatCurrency((valorLicencaBase * 0.5) / 2)} cada
                                </td>
                              )}
                              <td className="py-3 px-4">Imediato</td>
                            </tr>,
                          )
                          for (let i = 0; i < 10; i++) {
                            const valorParcela = (valorLicencaBase * 0.5) / 10
                            rows.push(
                              <tr key={`licenca-50-10x-parcela-${i + 1}`} className="border-b hover:bg-orange-500/10">
                                <td className="py-3 px-4">Licenciamento</td>
                                <td className="py-3 px-4">Parcela {i + 1}/10</td>
                                <td className="py-3 px-4 text-right font-semibold">{formatCurrency(valorParcela)}</td>
                                {dividirCartoes && (
                                  <td className="py-3 px-4 text-right text-blue-600">
                                    {formatCurrency(valorParcela / 2)} cada
                                  </td>
                                )}
                                <td className="py-3 px-4">Mês {i + 1}</td>
                              </tr>,
                            )
                          }
                        } else if (pagamentoLicenca === "20-10x") {
                          rows.push(
                            <tr key="licenca-20-3x-entrada" className="border-b hover:bg-orange-500/10">
                              <td className="py-3 px-4 font-semibold text-white">Licenciamento</td>
                              <td className="py-3 px-4 text-gray-400 font-light italic">Entrada (20%)</td>
                              <td className="py-3 px-4 text-right font-bold text-orange-400">
                                {formatCurrency(valorLicencaBase * 0.2)}
                              </td>
                              {dividirCartoes && (
                                <td className="py-3 px-4 text-right text-blue-600">
                                  {formatCurrency((valorLicencaBase * 0.2) / 2)} cada
                                </td>
                              )}
                              <td className="py-3 px-4">Imediato</td>
                            </tr>,
                          )
                          for (let i = 0; i < 10; i++) {
                            const valorParcela = (valorLicencaBase * 0.8) / 10
                            rows.push(
                              <tr key={`licenca-20-10x-parcela-${i + 1}`} className="border-b hover:bg-orange-500/10">
                                <td className="py-3 px-4">Licenciamento</td>
                                <td className="py-3 px-4">Parcela {i + 1}/10</td>
                                <td className="py-3 px-4 text-right font-semibold">{formatCurrency(valorParcela)}</td>
                                {dividirCartoes && (
                                  <td className="py-3 px-4 text-right text-blue-600">
                                    {formatCurrency(valorParcela / 2)} cada
                                  </td>
                                )}
                                <td className="py-3 px-4">Mês {i + 1}</td>
                              </tr>,
                            )
                          }
                        } else if (pagamentoLicenca === "30-10x") {
                          rows.push(
                            <tr key="licenca-30-10x-entrada" className="border-b hover:bg-orange-500/10">
                              <td className="py-3 px-4 font-semibold text-white">Licenciamento</td>
                              <td className="py-3 px-4 text-gray-400 font-light italic">Entrada (30%)</td>
                              <td className="py-3 px-4 text-right font-bold text-orange-400">
                                {formatCurrency(valorLicencaBase * 0.3)}
                              </td>
                              {dividirCartoes && (pagamentoLicenca === "50-10x" || pagamentoLicenca === "20-10x") && (
                                <td className="py-3 px-4 text-right">-</td>
                              )}
                              <td className="py-3 px-4">Imediato</td>
                            </tr>,
                          )
                          const valorRestante = valorLicencaBase * 0.7
                          const parcelaComJuros = calcularParcelaComJuros(valorRestante, 10, 3.99)
                          for (let i = 0; i < 10; i++) {
                            rows.push(
                              <tr key={`licenca-30-10x-parcela-${i + 1}`} className="border-b hover:bg-orange-500/10">
                                <td className="py-3 px-4">Licenciamento</td>
                                <td className="py-3 px-4">Parcela {i + 1}/10</td>
                                <td className="py-3 px-4 text-right font-semibold">
                                  {formatCurrency(parcelaComJuros)}
                                </td>
                                {dividirCartoes && (pagamentoLicenca === "50-10x" || pagamentoLicenca === "20-10x") && (
                                  <td className="py-3 px-4 text-right">-</td>
                                )}
                                <td className="py-3 px-4">Mês {i + 1}</td>
                              </tr>,
                            )
                          }
                        }

                        // Montagem
                        if (pagamentoMontagem === "vista") {
                          rows.push(
                            <tr key="montagem-vista" className="border-b hover:bg-blue-500/10">
                              <td className="py-3 px-4 font-semibold text-white">Montagem</td>
                              <td className="py-3 px-4 text-gray-400 font-light italic">À Vista</td>
                              <td className="py-3 px-4 text-right font-bold text-orange-400">
                                {formatCurrency(valorMontagemTotal)}
                              </td>
                              {dividirCartoes && (pagamentoLicenca === "50-10x" || pagamentoLicenca === "20-10x") && (
                                <td className="py-3 px-4 text-right">-</td>
                              )}
                              <td className="py-3 px-4">Após aprovação</td>
                            </tr>,
                          )
                        } else {
                          const numParcelasMontagem = Number.parseInt(pagamentoMontagem.replace("x", ""))
                          const valorParcelaMontagem = calcularParcelaMontagem(valorMontagemTotal, numParcelasMontagem)
                          for (let i = 0; i < numParcelasMontagem; i++) {
                            rows.push(
                              <tr key={`montagem-parcela-${i + 1}`} className="border-b hover:bg-blue-500/10">
                                <td className="py-3 px-4">Montagem</td>
                                <td className="py-3 px-4">
                                  Parcela {i + 1}/{numParcelasMontagem}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold">
                                  {formatCurrency(valorParcelaMontagem)}
                                </td>
                                {dividirCartoes && (pagamentoLicenca === "50-10x" || pagamentoLicenca === "20-10x") && (
                                  <td className="py-3 px-4 text-right">-</td>
                                )}
                                <td className="py-3 px-4">Mês {i + 1} (após aprovação)</td>
                              </tr>,
                            )
                          }
                        }
                        return rows
                      })()}
                    </tbody>
                  </table>
                </div>

                {dividirCartoes && (pagamentoLicenca === "50-10x" || pagamentoLicenca === "20-10x") && (
                  <div className="mt-4 p-4 bg-orange-500/5 rounded-lg border border-orange-500/20">
                    <div className="flex items-center gap-3 text-orange-400">
                      <CreditCard className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <span className="font-bold uppercase tracking-wider text-xs">Divisão em 2 Cartões Ativada</span>
                        <p className="text-xs mt-1 text-gray-400">
                          As parcelas do licenciamento serão distribuídas entre dois cartões de crédito simultaneamente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipamentos" className="space-y-6">
            <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl overflow-hidden">
              <CardHeader className="p-6 relative">
                <div className="absolute top-4 right-4 w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                  <Wrench className="text-orange-500 w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight text-white mb-2">Equipamentos Adicionais</CardTitle>
                  <CardDescription className="text-gray-400 text-sm">
                    Personalize sua unidade InHouse Market dimensionando equipamentos extras
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6 pt-0">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                    <Store className="w-5 h-5 text-orange-400" />
                    Segmentação Customizada de Plantas
                  </h3>
                  <p className="text-sm text-gray-400 mb-6 font-light">
                    Nossa modelagem atende perfeitamente a variados ambientes. Expanda a estrutura instalando equipamentos dedicados de alto consumo baseados na necessidade local.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-black/30 p-4 rounded-lg text-center border border-white/5 hover:border-orange-500/30 transition-colors group">
                      <Building2 className="w-6 h-6 text-gray-400 mx-auto mb-2 group-hover:text-orange-400 transition-colors" />
                      <div className="text-xs font-semibold text-gray-300">Condomínios</div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg text-center border border-white/5 hover:border-orange-500/30 transition-colors group">
                      <Hotel className="w-6 h-6 text-gray-400 mx-auto mb-2 group-hover:text-orange-400 transition-colors" />
                      <div className="text-xs font-semibold text-gray-300">Resorts / Hotéis</div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg text-center border border-white/5 hover:border-orange-500/30 transition-colors group">
                      <Building className="w-6 h-6 text-gray-400 mx-auto mb-2 group-hover:text-orange-400 transition-colors" />
                      <div className="text-xs font-semibold text-gray-300">Corporativo</div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg text-center border border-white/5 hover:border-orange-500/30 transition-colors group">
                      <Dumbbell className="w-6 h-6 text-gray-400 mx-auto mb-2 group-hover:text-orange-400 transition-colors" />
                      <div className="text-xs font-semibold text-gray-300">Academias</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4">Adicionar Novo Equipamento</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label htmlFor="nomeEquipamento" className="text-sm font-semibold text-gray-300">
                        Nome do Equipamento
                      </Label>
                      <Input
                        id="nomeEquipamento"
                        value={novoEquipamento.nome}
                        onChange={(e) => setNovoEquipamento({ ...novoEquipamento, nome: e.target.value })}
                        placeholder="Ex: Freezer Vertical Extra"
                        className="mt-1 bg-black/40 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="valorEquipamento" className="text-sm font-semibold text-gray-300">
                        Valor (R$)
                      </Label>
                      <Input
                        id="valorEquipamento"
                        type="number"
                        value={novoEquipamento.valor}
                        onChange={(e) => setNovoEquipamento({ ...novoEquipamento, valor: Number(e.target.value) || 0 })}
                        placeholder="0,00"
                        className="mt-1 bg-black/40 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantidadeEquipamento" className="text-sm font-semibold text-gray-300">
                        Quantidade
                      </Label>
                      <Input
                        id="quantidadeEquipamento"
                        type="number"
                        min="1"
                        value={novoEquipamento.quantidade}
                        onChange={(e) =>
                          setNovoEquipamento({ ...novoEquipamento, quantidade: Number(e.target.value) || 1 })
                        }
                        className="mt-1 bg-black/40 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={adicionarEquipamento}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2 mt-2 h-11"
                  >
                    <Plus className="w-5 h-5" /> Integrar ao Investimento Total
                  </Button>
                </div>

                {equipamentosAdicionais.length > 0 && (
                  <div className="bg-orange-500/5 backdrop-blur-md p-6 rounded-xl border border-orange-500/20">
                    <h3 className="text-lg font-bold text-orange-400 mb-4">Hardware Opcional Adicionado</h3>
                    <div className="space-y-3">
                      {equipamentosAdicionais.map((eq, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-white">{eq.nome}</div>
                            <div className="text-sm text-gray-400">
                              {formatCurrency(eq.valor)} × {eq.quantidade} = <span className="text-white font-bold">{formatCurrency(eq.valor * eq.quantidade)}</span>
                            </div>
                          </div>
                          <Button
                            onClick={() => removerEquipamento(index)}
                            variant="ghost"
                            size="sm"
                            className="ml-4 hover:bg-red-500/20 hover:text-red-400 text-gray-400 gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Remover
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center px-2">
                       <span className="font-bold text-gray-400">Custo Total de Adicionais:</span>
                       <span className="text-2xl font-bold text-white">
                         {formatCurrency(equipamentosAdicionais.reduce((total, eq) => total + eq.valor * eq.quantidade, 0))}
                       </span>
                    </div>
                  </div>
                )}

                <div className="bg-[#111111] border border-white/5 p-8 rounded-xl text-white relative overflow-hidden flex flex-col items-center justify-center">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"></div>
                  <MonitorPlay className="w-12 h-12 text-gray-600 mb-4" />
                  <h3 className="text-lg font-bold mb-2 text-gray-300">Visualização 3D da Loja</h3>
                  <p className="text-sm text-gray-500 font-light text-center">
                    Mockup 3D interativo da unidade personalizada InHouse Market.
                  </p>
                  <Button variant="outline" className="mt-6 border-white/10 bg-white/5 text-gray-300 hover:text-white" disabled>
                    Módulo em Desenvolvimento
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="produtos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Estrutura da Loja */}
              <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl overflow-hidden">
                <CardHeader className="bg-white/5 backdrop-blur-md border-b border-white/10 p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500/20 border border-orange-500/30 rounded-full w-10 h-10 flex items-center justify-center">
                      <Store className="text-orange-400 w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-white">Estrutura da Loja</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Projeto arquitetônico completo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Mobiliário personalizado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Equipamentos de refrigeração</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Sistema de iluminação LED</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Balcões e expositores</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Sinalização e comunicação visual</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Tecnologia */}
              <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl overflow-hidden">
                <CardHeader className="bg-white/5 backdrop-blur-md border-b border-white/10 p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500/20 border border-orange-500/30 rounded-full w-10 h-10 flex items-center justify-center">
                       <Laptop className="text-orange-400 w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-white">Tecnologia</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Sistema PDV completo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>App de delivery próprio</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Integração com iFood/Uber Eats</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Sistema de gestão integrado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Câmeras de segurança</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Wi-Fi para clientes</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Treinamento e Suporte */}
              <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl overflow-hidden">
                <CardHeader className="bg-white/5 backdrop-blur-md border-b border-white/10 p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500/20 border border-orange-500/30 rounded-full w-10 h-10 flex items-center justify-center">
                       <GraduationCap className="text-orange-400 w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-white">Treinamento e Suporte</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Treinamento operacional completo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Capacitação em vendas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Gestão financeira</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Marketing digital</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Suporte técnico contínuo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Manual de operações</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Produtos e Estoque */}
              <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl overflow-hidden">
                <CardHeader className="bg-white/5 backdrop-blur-md border-b border-white/10 p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500/20 border border-orange-500/30 rounded-full w-10 h-10 flex items-center justify-center">
                      <Package className="text-orange-400 w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-white">Produtos e Estoque</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Estoque inicial completo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Mix de produtos selecionados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Fornecedores homologados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Sistema de reposição automática</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Controle de validade</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Gestão de perdas</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Marketing */}
              <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl overflow-hidden">
                <CardHeader className="bg-white/5 backdrop-blur-md border-b border-white/10 p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500/20 border border-orange-500/30 rounded-full w-10 h-10 flex items-center justify-center">
                      <Megaphone className="text-orange-400 w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-white">Marketing</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Campanha de inauguração</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Material promocional</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Estratégias de marketing local</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Redes sociais</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Programa de fidelidade</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Ações promocionais</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Manutenção */}
              <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl overflow-hidden">
                <CardHeader className="bg-white/5 backdrop-blur-md border-b border-white/10 p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500/20 border border-orange-500/30 rounded-full w-10 h-10 flex items-center justify-center">
                       <Wrench className="text-orange-400 w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-white">Manutenção</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Manutenção preventiva</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Suporte técnico 24/7</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Reposição de equipamentos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Atualizações de software</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Consultoria operacional</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Relatórios de performance</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dre" className="space-y-6">
            <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg p-4">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações de Faturamento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="ticketCompra" className="text-base font-semibold">
                      Ticket Médio por Apartamento (R$)
                    </Label>
                    <p className="text-sm text-gray-300 mb-3">Valor médio de compra mensal por apartamento</p>
                    <Input
                      id="ticketCompra"
                      type="number"
                      min="0"
                      step="10"
                      value={ticketCompra}
                      onChange={(e) => setTicketCompra(Number(e.target.value) || 0)}
                      className="text-lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="numApartamentos" className="text-base font-semibold">
                      Quantidade de Apartamentos
                    </Label>
                    <p className="text-sm text-gray-300 mb-3">Número total de apartamentos no condomínio</p>
                    <Input
                      id="numApartamentos"
                      type="number"
                      min="0"
                      value={numApartamentos}
                      onChange={(e) => setNumApartamentos(Number(e.target.value) || 0)}
                      className="text-lg"
                    />
                  </div>
                </div>
                <div className="mt-4 p-4 bg-orange-500/5 rounded-lg border border-orange-500/20">
                  <div className="flex items-center gap-3 text-orange-400">
                    <TrendingUp className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <span className="font-bold uppercase tracking-widest text-xs">Faturamento Bruto Projetado por Loja:</span>
                      <span className="ml-2 text-lg font-bold text-white">{formatCurrency(ticketCompra * numApartamentos)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg p-4">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuração de Repasse
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="percentualRepasse" className="text-base font-semibold">
                      Percentual de Repasse ao Condomínio
                    </Label>
                    <p className="text-sm text-gray-300 mb-3">
                      Ajuste o percentual de repasse de 0% a 5% conforme o acordo com o condomínio
                    </p>
                    <div className="flex items-center gap-4">
                      <Input
                        id="percentualRepasse"
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={percentualRepasse}
                        onChange={(e) => {
                          const valor = Number.parseFloat(e.target.value)
                          if (valor >= 0 && valor <= 5) {
                            setPercentualRepasse(valor)
                          }
                        }}
                        className="w-32"
                      />
                      <span className="text-lg font-semibold text-orange-600">{percentualRepasse}%</span>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={percentualRepasse}
                        onChange={(e) => setPercentualRepasse(Number.parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-gray-500/20 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {numLojas > 1 && (
              <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg p-4">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Projeções Avançadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="projecaoHabilitada"
                      checked={projecaoHabilitada}
                      onChange={(e) => setProjecaoHabilitada(e.target.checked)}
                      className="w-5 h-5 text-purple-600"
                    />
                    <Label htmlFor="projecaoHabilitada" className="text-base font-semibold cursor-pointer">
                      Habilitar Projeções com Maturação
                    </Label>
                  </div>

                  {projecaoHabilitada && (
                    <>
                      <div>
                        <Label htmlFor="tempoMaturacao" className="text-sm font-semibold">
                          Tempo de Maturação (meses)
                        </Label>
                        <p className="text-xs text-gray-300 mb-2">Período para atingir 100% do faturamento</p>
                        <Input
                          id="tempoMaturacao"
                          type="number"
                          min="1"
                          max="12"
                          value={tempoMaturacao}
                          onChange={(e) => setTempoMaturacao(Number(e.target.value) || 3)}
                          className="w-32"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="inauguracaoCascateada"
                          checked={inauguracaoCascateada}
                          onChange={(e) => setInauguracaoCascateada(e.target.checked)}
                          className="w-5 h-5 text-purple-600"
                        />
                        <Label htmlFor="inauguracaoCascateada" className="text-base font-semibold cursor-pointer">
                          Inauguração Cascateada
                        </Label>
                      </div>

                      {inauguracaoCascateada && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                          <div>
                            <Label htmlFor="intervaloSegundaLoja" className="text-sm font-semibold">
                              Intervalo para 2ª Loja (dias)
                            </Label>
                            <Select
                              value={intervaloSegundaLoja.toString()}
                              onValueChange={(value) => setIntervaloSegundaLoja(Number(value))}
                            >
                              <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="30">30 dias</SelectItem>
                                <SelectItem value="60">60 dias</SelectItem>
                                <SelectItem value="90">90 dias</SelectItem>
                                <SelectItem value="120">120 dias</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {numLojas >= 3 && (
                            <div>
                              <Label htmlFor="intervaloTerceiraLoja" className="text-sm font-semibold">
                                Intervalo para 3ª Loja (dias)
                              </Label>
                              <Select
                                value={intervaloTerceiraLoja.toString()}
                                onValueChange={(value) => setIntervaloTerceiraLoja(Number(value))}
                              >
                                <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="30">30 dias</SelectItem>
                                  <SelectItem value="60">60 dias</SelectItem>
                                  <SelectItem value="90">90 dias</SelectItem>
                                  <SelectItem value="120">120 dias</SelectItem>
                                  <SelectItem value="180">180 dias</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-orange-500 text-lg sm:text-xl flex items-center gap-3 uppercase tracking-wider">
                  <PieChart className="w-6 h-6" /> DRE Mensal Projetado
                </CardTitle>
                <CardDescription className="text-sm tracking-wide text-gray-400">
                  Demonstrativo de Resultados do Exercício baseado no faturamento configurado
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead>
                      <tr className="border-b-2 border-white/20 bg-orange-500/10">
                        <th className="text-left py-3 px-4 font-semibold">Item</th>
                        <th className="text-right py-3 px-4 font-semibold">% Faturamento</th>
                        <th className="text-right py-3 px-4 font-semibold">Valor (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b bg-green-500/10">
                        <td className="py-3 px-4 font-semibold">Faturamento Bruto</td>
                        <td className="py-3 px-4 text-right font-semibold">100,00%</td>
                        <td className="py-3 px-4 text-right font-bold text-green-400">
                          {formatCurrency(dreData.faturamentoMensal)}
                        </td>
                      </tr>

                      <tr className="border-b hover:bg-orange-500/10/50">
                        <td className="py-3 px-4">(-) CMV</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end items-center gap-1">
                            <span className="text-gray-400">-</span>
                            <Input type="number" step="0.1" className="w-20 h-8 text-right px-2 py-1 bg-white/5 border border-white/10 focus:border-orange-500 text-white" value={dreConfigs.cmv.valor} onChange={(e) => handleDreConfigChange('cmv', Number(e.target.value))} />
                            <span className="text-gray-400">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-red-600">
                          -{formatCurrency(dreData.custoVariavel)}
                        </td>
                      </tr>

                      <tr className="border-b bg-green-500/10">
                        <td className="py-3 px-4 font-semibold">Lucro Bruto</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {((dreData.margemContribuicao / dreData.faturamentoMensal) * 100).toFixed(2)}%
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-green-400">
                          {formatCurrency(dreData.margemContribuicao)}
                        </td>
                      </tr>

                      <tr className="border-b hover:bg-orange-500/10/50">
                        <td className="py-3 px-4 pl-8">(-) Taxas Bancárias</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end items-center gap-1">
                            <span className="text-gray-400">-</span>
                            <Input type="number" step="0.1" className="w-20 h-8 text-right px-2 py-1 bg-white/5 border border-white/10 focus:border-orange-500 text-white" value={dreConfigs.taxasBancarias.valor} onChange={(e) => handleDreConfigChange('taxasBancarias', Number(e.target.value))} />
                            <span className="text-gray-400">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-red-600">-{formatCurrency(dreData.taxasBancarias)}</td>
                      </tr>

                      <tr className="border-b hover:bg-orange-500/10/50">
                        <td className="py-3 px-4 pl-8 font-semibold">
                          (-) Repasse ao condomínio
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end items-center gap-1">
                            <span className="text-gray-400">-</span>
                            <Input type="number" max="5" step="0.1" className="w-20 h-8 text-right px-2 py-1 font-semibold" value={percentualRepasse} onChange={(e) => setPercentualRepasse(Number(e.target.value) || 0)} />
                            <span className="text-gray-400 font-semibold">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-red-600 font-semibold">
                          -{formatCurrency(dreData.repasse)}
                        </td>
                      </tr>

                      <tr className="border-b bg-blue-500/10/30 hover:bg-blue-500/10/80">
                        <td className="py-2 px-4 pl-12 text-sm text-gray-300">• Internet (p/ loja)</td>
                        <td className="py-2 px-4 text-right text-gray-300 text-sm">
                          -{((dreData.internet / dreData.faturamentoMensal) * 100).toFixed(2)}%
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex justify-end items-center gap-1">
                            <span className="text-gray-400 text-sm">-R$</span>
                            <Input type="number" step="1" className="w-24 h-8 text-right px-2 py-1 text-sm bg-white/5 border border-white/10 focus:border-orange-500 text-white" value={dreConfigs.internet.valor} onChange={(e) => handleDreConfigChange('internet', Number(e.target.value))} />
                          </div>
                        </td>
                      </tr>

                      <tr className="border-b bg-blue-500/10/30 hover:bg-blue-500/10/80">
                        <td className="py-2 px-4 pl-12 text-sm text-gray-300">• Energia (p/ loja)</td>
                        <td className="py-2 px-4 text-right text-gray-300 text-sm">
                          -{((dreData.energia / dreData.faturamentoMensal) * 100).toFixed(2)}%
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex justify-end items-center gap-1">
                            <span className="text-gray-400 text-sm">-R$</span>
                            <Input type="number" step="1" className="w-24 h-8 text-right px-2 py-1 text-sm bg-white/5 border border-white/10 focus:border-orange-500 text-white" value={dreConfigs.energia.valor} onChange={(e) => handleDreConfigChange('energia', Number(e.target.value))} />
                          </div>
                        </td>
                      </tr>

                      <tr className="border-b bg-blue-500/10/30 hover:bg-blue-500/10/80">
                        <td className="py-2 px-4 pl-12 text-sm text-gray-300">• Limpeza (p/ loja)</td>
                        <td className="py-2 px-4 text-right text-gray-300 text-sm">
                          -{((dreData.limpeza / dreData.faturamentoMensal) * 100).toFixed(2)}%
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex justify-end items-center gap-1">
                            <span className="text-gray-400 text-sm">-R$</span>
                            <Input type="number" step="1" className="w-24 h-8 text-right px-2 py-1 text-sm bg-white/5 border border-white/10 focus:border-orange-500 text-white" value={dreConfigs.limpeza.valor} onChange={(e) => handleDreConfigChange('limpeza', Number(e.target.value))} />
                          </div>
                        </td>
                      </tr>

                      <tr className="border-b hover:bg-orange-500/10/50">
                        <td className="py-3 px-4 pl-8">(-) Mensalidade InHouse</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end items-center gap-1">
                            <span className="text-gray-400">-</span>
                            <Input type="number" step="0.1" className="w-20 h-8 text-right px-2 py-1 bg-white/5 border border-white/10 focus:border-orange-500 text-white" value={dreConfigs.mensalidadeInhouse.valor} onChange={(e) => handleDreConfigChange('mensalidadeInhouse', Number(e.target.value))} disabled={dreData.faturamentoMensal <= 250} />
                            <span className="text-gray-400">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-red-600">
                          -{formatCurrency(dreData.mensalidadeInhouse)}
                        </td>
                      </tr>

                      <tr className="border-b hover:bg-orange-500/10/50">
                        <td className="py-3 px-4 pl-8">(-) DAS (p/ loja)</td>
                        <td className="py-3 px-4 text-right">
                          -{((dreData.das / dreData.faturamentoMensal) * 100).toFixed(2)}%
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end items-center gap-1">
                            <span className="text-gray-400 text-sm">-R$</span>
                            <Input type="number" step="1" className="w-24 h-8 text-right px-2 py-1 bg-white/5 border border-white/10 focus:border-orange-500 text-white" value={dreConfigs.das.valor} onChange={(e) => handleDreConfigChange('das', Number(e.target.value))} />
                          </div>
                        </td>
                      </tr>

                      <tr className="border-b hover:bg-orange-500/10/50">
                        <td className="py-3 px-4 pl-8">(-) Perda de Estoque</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end items-center gap-1">
                            <span className="text-gray-400">-</span>
                            <Input type="number" step="0.1" className="w-20 h-8 text-right px-2 py-1 bg-white/5 border border-white/10 focus:border-orange-500 text-white" value={dreConfigs.perdaEstoque.valor} onChange={(e) => handleDreConfigChange('perdaEstoque', Number(e.target.value))} />
                            <span className="text-gray-400">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-red-600">-{formatCurrency(dreData.perdaEstoque)}</td>
                      </tr>

                      <tr className="border-b hover:bg-orange-500/10/50">
                        <td className="py-3 px-4 pl-8">(-) Despesas Contábeis</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end items-center gap-1">
                            <span className="text-gray-400">-</span>
                            <Input type="number" step="0.1" className="w-20 h-8 text-right px-2 py-1 bg-white/5 border border-white/10 focus:border-orange-500 text-white" value={dreConfigs.despesasContabeis.valor} onChange={(e) => handleDreConfigChange('despesasContabeis', Number(e.target.value))} />
                            <span className="text-gray-400">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-red-600">
                          -{formatCurrency(dreData.despesasContabeis)}
                        </td>
                      </tr>

                      <tr className="border-b hover:bg-orange-500/10/50">
                        <td className="py-3 px-4 pl-8">(-) Manutenção da Loja</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end items-center gap-1">
                            <span className="text-gray-400">-</span>
                            <Input type="number" step="0.1" className="w-20 h-8 text-right px-2 py-1 bg-white/5 border border-white/10 focus:border-orange-500 text-white" value={dreConfigs.manutencaoLoja.valor} onChange={(e) => handleDreConfigChange('manutencaoLoja', Number(e.target.value))} />
                            <span className="text-gray-400">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-red-600">-{formatCurrency(dreData.manutencaoLoja)}</td>
                      </tr>

                      <tr className="border-b hover:bg-orange-500/10/50">
                        <td className="py-3 px-4 pl-8">(-) Veículos e Combustível</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end items-center gap-1">
                            <span className="text-gray-400">-</span>
                            <Input type="number" step="0.1" className="w-20 h-8 text-right px-2 py-1 bg-white/5 border border-white/10 focus:border-orange-500 text-white" value={dreConfigs.veiculosCombustivel.valor} onChange={(e) => handleDreConfigChange('veiculosCombustivel', Number(e.target.value))} />
                            <span className="text-gray-400">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-red-600">
                          -{formatCurrency(dreData.veiculosCombustivel)}
                        </td>
                      </tr>

                      <tr className="border-b-2 border-green-200 bg-green-500/10">
                        <td className="py-4 px-4 font-bold text-lg">LUCRO LÍQUIDO</td>
                        <td className="py-4 px-4 text-right font-bold text-lg">
                          {((dreData.lucroLiquido / dreData.faturamentoMensal) * 100).toFixed(2)}%
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-xl text-green-400">
                          {formatCurrency(dreData.lucroLiquido)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white border-0 shadow-lg relative overflow-hidden">
                <CardContent className="p-4 sm:p-6 text-center z-10 relative">
                  <div className="flex justify-center mb-3">
                    <Banknote className="w-8 h-8 text-green-300" />
                  </div>
                  <div className="text-sm opacity-90 mb-1">Lucro Líquido Mensal</div>
                  <div className="text-xl sm:text-2xl font-bold">{formatCurrency(dreData.lucroLiquido)}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-md border border-white/10 text-white shadow-lg">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <CalendarDays className="w-8 h-8 text-orange-400" />
                  </div>
                  <div className="text-sm text-gray-400 mb-1">Payback</div>
                  <div className="text-xl sm:text-2xl font-bold text-orange-400">
                    {dreData.lucroLiquido > 0 ? Math.ceil(investimentoTotal / dreData.lucroLiquido) : 0} meses
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-md border border-white/10 text-white shadow-lg">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <TrendingUp className="w-8 h-8 text-orange-400" />
                  </div>
                  <div className="text-sm text-gray-400 mb-1">ROI Anual</div>
                  <div className="text-xl sm:text-2xl font-bold text-orange-400">
                    {dreData.lucroLiquido > 0
                      ? (((dreData.lucroLiquido * 12) / investimentoTotal) * 100).toFixed(1)
                      : 0}
                    %
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-md border border-white/10 text-white shadow-lg">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <PieChart className="w-8 h-8 text-orange-400" />
                  </div>
                  <div className="text-sm text-gray-400 mb-1">Lucro Anual</div>
                  <div className="text-xl sm:text-2xl font-bold text-orange-400">{formatCurrency(dreData.lucroLiquido * 12)}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-[#111111] overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-500/10 p-3 rounded-full flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white tracking-widest uppercase mb-2">Análise Estratégica</h4>
                    <p className="text-sm text-gray-400 font-light leading-relaxed">
                      {dreData.lucroLiquido > 0 && investimentoTotal > 0 ? (
                        <>
                          Projeção aponta Payback veloz em <strong className="text-orange-400">{Math.ceil(investimentoTotal / dreData.lucroLiquido)} meses</strong> e ROI anual agressivo
                          de <strong className="text-orange-400">{(((dreData.lucroLiquido * 12) / investimentoTotal) * 100).toFixed(1)}%</strong>.
                          {numLojas > 1 && (
                            <>
                              {" "}
                              Escalando para {numLojas} unidades em operação contínua, vislumbra-se {formatCurrency(dreData.faturamentoMensal)} em
                              faturamento sistêmico constante e <strong className="text-green-400">{((dreData.lucroLiquido / dreData.faturamentoMensal) * 100).toFixed(1)}% de margem real</strong> de
                              rentabilidade livre.
                            </>
                          )}{" "}
                          <br /><span className="text-white mt-1 inline-block">Cenário financeiro com altíssima tração para aprovação.</span>
                        </>
                      ) : (
                        "Dimensionamento insuficiente do faturamento para gerar a análise do ecossistema InHouse."
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {projecaoHabilitada && (
              <Card className="border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-orange-500 text-lg sm:text-xl flex items-center gap-3 uppercase tracking-wider">
                    <TrendingUp className="w-6 h-6" /> Projeção de Evolução
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Evolução mensal considerando maturação e inauguração cascateada
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-sm">
                      <thead>
                        <tr className="border-b-2 border-white/20 bg-orange-500/10">
                          <th className="text-left py-2 px-2">Mês</th>
                          <th className="text-right py-2 px-2">Faturamento</th>
                          <th className="text-right py-2 px-2">Lucro Líquido</th>
                          <th className="text-center py-2 px-2">Lojas Ativas</th>
                          <th className="text-right py-2 px-2">ROI Acumulado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 12 }, (_, i) => {
                          const mes = i + 1
                          const dadosMes = calcularDREComProjecao(mes)
                          const lucroAcumulado = Array.from(
                            { length: mes },
                            (_, j) => calcularDREComProjecao(j + 1).lucroLiquido,
                          ).reduce((a, b) => a + b, 0)
                          const roiAcumulado = investimentoTotal ? (lucroAcumulado / investimentoTotal) * 100 : 0

                          return (
                            <tr
                              key={mes}
                              className={`border-b border-white/10 hover:bg-orange-500/20 ${mes % 2 === 0 ? "bg-white/5" : "bg-transparent"}`}
                            >
                              <td className="py-2 px-2 font-semibold">Mês {mes}</td>
                              <td className="py-2 px-2 text-right">{formatCurrency(dadosMes.faturamentoMensal)}</td>
                              <td className="py-2 px-2 text-right font-semibold text-green-400">
                                {formatCurrency(dadosMes.lucroLiquido)}
                              </td>
                              <td className="py-2 px-2 text-center">{dadosMes.lojasAtivas || numLojas}</td>
                              <td className="py-2 px-2 text-right font-semibold">{roiAcumulado.toFixed(1)}%</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 p-6 bg-[#0f0f0f] rounded-xl border border-white/10 shadow-inner">
                    <h4 className="font-bold text-orange-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                       <PieChart className="w-4 h-4" /> Resumo Consolidado (12 meses)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400 text-xs uppercase font-bold">Faturamento Total:</span>
                        <div className="text-xl font-bold text-white">
                          {formatCurrency(
                            Array.from(
                              { length: 12 },
                              (_, i) => calcularDREComProjecao(i + 1).faturamentoMensal,
                            ).reduce((a, b) => a + b, 0),
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs uppercase font-bold">Lucro Acumulado:</span>
                        <div className="text-xl font-bold text-green-400">
                          {formatCurrency(
                            Array.from({ length: 12 }, (_, i) => calcularDREComProjecao(i + 1).lucroLiquido).reduce(
                              (a, b) => a + b,
                              0,
                            ),
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs uppercase font-bold">ROI em 12 meses:</span>
                        <div className="text-xl font-bold text-orange-400">
                          {investimentoTotal
                            ? (
                                (Array.from(
                                  { length: 12 },
                                  (_, i) => calcularDREComProjecao(i + 1).lucroLiquido,
                                ).reduce((a, b) => a + b, 0) /
                                  investimentoTotal) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}


          </TabsContent>

          <TabsContent value="proposta" className="space-y-6">
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 mb-6 flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <Label htmlFor="pdfCliente" className="text-sm font-semibold text-gray-300">Cliente / Empresa Alvo</Label>
                <Input id="pdfCliente" type="text" placeholder="Ex: Condomínio Villa Real" className="mt-2 bg-black/40 border-white/10 text-white h-12" value={clienteName} onChange={(e) => setClienteName(e.target.value)} />
              </div>
              <div className="flex-1 w-full">
                <Label htmlFor="pdfVendedor" className="text-sm font-semibold text-gray-300">Consultor Responsável</Label>
                <Input id="pdfVendedor" type="text" placeholder="Ex: João Fernandes" className="mt-2 bg-black/40 border-white/10 text-white h-12" value={vendedorName} onChange={(e) => setVendedorName(e.target.value)} />
              </div>
              <Button onClick={downloadPDF} className="bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2 h-12 px-8 shrink-0 w-full sm:w-auto shadow-lg shadow-orange-500/20">
                <Download className="w-5 h-5" /> Exportar Proposta PDF
              </Button>
            </div>
            
            {/* Slide Container para PDF (Largura fixada em 1280px e altura dinâmica) */}
            <div className="w-full overflow-x-auto scroller px-2 pb-4">
              <div ref={slideRef} className="bg-[#0a0a0a] min-w-[1280px] w-[1280px] h-auto min-h-[720px] p-12 relative flex flex-col gap-10 border-2 border-white/10 rounded-xl shadow-2xl mx-auto overflow-hidden">
                {/* Background Ambient Layers inside slide */}
                <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[20%] bg-orange-600/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-[-5%] right-[-10%] w-[30%] h-[20%] bg-orange-800/10 rounded-full blur-[120px] pointer-events-none"></div>

                {/* Cabeçalho */}
                <div className="flex justify-between items-start border-b border-white/10 pb-8 relative z-10 shrink-0">
                  <img src="https://tqiqnxkncezmzublpdxg.supabase.co/storage/v1/object/public/img/logoinhouse.png" alt="InHouse Logo" className="h-20" />
                  <div className="text-right">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 tracking-tight">PROPOSTA COMERCIAL</h1>
                    <p className="text-gray-400 text-xl font-light tracking-widest mt-2 uppercase">Simulação Oficial Executiva</p>
                  </div>
                </div>

                <div className="bg-orange-500/10 p-5 rounded-xl border border-orange-500/20 text-center tracking-wide mt-2 mb-4 shrink-0 relative z-10">
                   <p className="text-gray-300 text-2xl font-light">Preparado exclusivamente para: <strong className="text-white ml-2 text-3xl font-semibold">{clienteName || "_________________"}</strong></p>
                   <p className="text-orange-400 text-lg mt-3 font-semibold uppercase tracking-widest">Consultor: {vendedorName || "_________________"}</p>
                </div>

                {/* Corpo do Doc */}
                <div className="flex flex-col gap-10 flex-1 relative z-10">

                  {/* Linha 1: Investimento e Retorno */}
                  <div className="grid grid-cols-2 gap-12">
                    {/* Coluna Esquerda: Investimento */}
                    <div className="space-y-8 flex flex-col">
                      <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 flex-1">
                        <h3 className="text-orange-500 text-2xl font-bold mb-6 uppercase tracking-widest flex items-center gap-3">
                          <Banknote className="w-6 h-6" /> Resumo do Investimento
                        </h3>
                        <div className="space-y-6 text-2xl font-light">
                          <div className="flex justify-between border-b border-white/5 pb-3">
                            <span className="text-gray-400">Total de Lojas:</span>
                            <span className="font-bold text-white">{numLojas}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-3">
                            <span className="text-gray-400">Licenciamento:</span>
                            <span className="font-bold text-white">{formatCurrency(16000 + (numLojas - 1) * 6000)}</span>
                          </div>
                          <div className="flex justify-between pb-2">
                            <span className="text-gray-400">Montagem e Equip:</span>
                            <span className="font-bold text-white">{formatCurrency(24000 * numLojas + valorEquipamentosAdicionais)}</span>
                          </div>
                          
                          <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/10 p-6 rounded-xl mt-8 border border-orange-500/30">
                            <div className="flex justify-between font-bold text-3xl text-orange-400">
                              <span>Investimento Total</span>
                              <span>{formatCurrency(investimentoTotal)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coluna Direita: DRE e Por Que InHouse */}
                    <div className="space-y-8 flex flex-col">
                      <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 flex-1">
                        <h3 className="text-green-500 text-2xl font-bold mb-6 uppercase tracking-widest flex items-center gap-3">
                          <TrendingUp className="w-6 h-6" /> Potencial de Retorno
                        </h3>
                        <div className="space-y-6 text-2xl font-light">
                          <div className="flex justify-between border-b border-white/5 pb-3">
                            <span className="text-gray-400">Base Atendida (Aptos):</span>
                            <span className="font-bold text-white">{numApartamentos}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-3">
                            <span className="text-gray-400">Faturamento Projetado:</span>
                            <span className="font-bold text-white">{formatCurrency(dreData.faturamentoMensal)}/mês</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-3">
                            <span className="text-gray-400">Lucro Bruto:</span>
                            <span className="font-bold text-green-400">{formatCurrency(dreData.margemContribuicao)}</span>
                          </div>
                          <div className="flex justify-between pb-3 mt-4">
                            <span className="text-gray-400">Rentabilidade Estimada/Ano:</span>
                            <span className="font-bold text-green-400">{formatCurrency(dreData.lucroLiquido * 12)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Linha 2: Condições e Cronograma */}
                  <div className="grid grid-cols-2 gap-12">
                    <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10">
                      <h3 className="text-orange-400 text-xl font-bold mb-6 uppercase tracking-widest flex items-center gap-3">
                        <CreditCard className="w-5 h-5" /> Condições de Pagamento
                      </h3>
                      <div className="space-y-4 text-xl font-light">
                        <div className="flex justify-between border-b border-white/5 pb-3">
                          <span className="text-gray-400">Licenciamento:</span>
                          <span className="font-bold text-white uppercase">{pagamentoLicenca.replace('-', ' em ')}</span>
                        </div>
                        <div className="flex justify-between pb-3">
                          <span className="text-gray-400">Montagem e Equip:</span>
                          <span className="font-bold text-white uppercase">{pagamentoMontagem.replace('-', ' em ')} {pagamentoMontagem !== 'vista' ? parcelasMontagem + 'x' : ''}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10">
                      <h3 className="text-white text-xl font-bold mb-6 uppercase tracking-widest flex items-center gap-3">
                        <CalendarDays className="w-5 h-5" /> Prazos e Cronograma
                      </h3>
                      <div className="space-y-4 text-xl font-light">
                        <div className="flex justify-between border-b border-white/5 pb-3">
                          <span className="text-gray-400">Entrega Estimada Padrão:</span>
                          <span className="font-bold text-white">45 a 60 dias</span>
                        </div>
                        <div className="flex justify-between pb-3">
                          <span className="text-gray-400">Início de Maturidade Comercial:</span>
                          <span className="font-bold text-white">{tempoMaturacao} Meses</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Linha 3: Equipamentos e Produtos */}
                  <div className="grid grid-cols-2 gap-12">
                    <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10">
                      <h3 className="text-orange-400 text-xl font-bold mb-6 uppercase tracking-widest flex items-center gap-3">
                        <Wrench className="w-5 h-5" /> Equipamentos Inclusos
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-lg text-gray-300">
                        <li>Gôndolas metálicas completas (10 prateleiras)</li>
                        <li>Cervejeira Fricon com controle Wi-Fi (220v)</li>
                        <li>Refrigerador Fricon Wi-Fi (220v)</li>
                        <li>Freezer Vertical Consu (220v)</li>
                        <li>Checkout Totem Completo, Balança, Scanner Bióptico</li>
                        <li>Câmeras Intelbras com IA e DVR 16 canais</li>
                        <li>Nobreak, Roteador e Sistema de Som Integrado</li>
                        {equipamentosAdicionais.map((eq, i) => (
                           <li key={i} className="text-orange-300 font-semibold">{eq.quantidade}x {eq.nome}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10">
                      <h3 className="text-white text-xl font-bold mb-6 uppercase tracking-widest flex items-center gap-3">
                        <Package className="w-5 h-5" /> Segmento de Produtos
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-lg text-gray-300">
                        <li>Bebidas Não Alcoólicas (Refrigerantes, Águas)</li>
                        <li>Mercearia Doce (Doces, Biscoitos, Chocolates)</li>
                        <li>Mercearia Salgada (Salgadinhos, Aperitivos)</li>
                        <li>Bomboniere e Sorvetes Diversos</li>
                        <li>Itens de Adega, Vinhos e Bebidas Premium</li>
                        <li>Higiene Pessoal, Limpeza e Pet Shop</li>
                        <li>Tabacaria e Produtos Especiais</li>
                      </ul>
                    </div>
                  </div>

                  {/* Linha 4: DRE Resumido de 1 Mês Completo */}
                  <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10">
                      <h3 className="text-green-500 text-xl font-bold mb-6 uppercase tracking-widest flex items-center gap-3">
                        <PieChart className="w-5 h-5" /> DRE - Demonstrativo de Resultado Projetado
                      </h3>
                      <div className="grid grid-cols-2 gap-8 text-xl font-light">
                        <div className="space-y-4">
                          <div className="flex justify-between border-b border-white/5 pb-2 text-gray-400">
                            <span>(+) Faturamento Bruto</span>
                            <span className="font-bold text-white">{formatCurrency(dreData.faturamentoMensal)}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2 text-gray-400">
                            <span>(-) CMV Implícito ({dreConfigs.cmv.valor}%)</span>
                            <span className="font-bold text-red-400">-{formatCurrency((dreData.faturamentoMensal * dreConfigs.cmv.valor) / 100)}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2 text-gray-400">
                            <span>(-) Impostos DAS ({dreConfigs.das.valor}R$)</span>
                            <span className="font-bold text-red-400">-{formatCurrency(dreConfigs.das.valor)}</span>
                          </div>
                          <div className="flex justify-between pt-2">
                             <span className="text-gray-300">(=) Lucro Bruto Comercial</span>
                             <span className="font-bold text-green-400">{formatCurrency(dreData.margemContribuicao)}</span>
                          </div>
                        </div>
                        <div className="space-y-4 border-l border-white/10 pl-8">
                          <div className="flex justify-between border-b border-white/5 pb-2 text-gray-400">
                            <span>(-) Despesas Fixas Previstas</span>
                            <span className="font-bold text-red-400">-{formatCurrency(dreConfigs.energia.valor + dreConfigs.limpeza.valor + dreConfigs.internet.valor)}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2 text-gray-400">
                            <span>(-) Custos Variáveis (Taxas + Royalties)</span>
                            <span className="font-bold text-red-400">-{formatCurrency((dreData.faturamentoMensal * dreConfigs.mensalidadeInhouse.valor)/100 + (dreData.faturamentoMensal * dreConfigs.taxasBancarias.valor)/100)}</span>
                          </div>
                          <div className="flex justify-between pt-4 mt-2 border-t border-white/20">
                             <span className="text-white font-bold uppercase">Resultado Líquido (Mês)</span>
                             <span className="font-bold text-green-400 text-2xl">{formatCurrency(dreData.lucroLiquido)}</span>
                          </div>
                        </div>
                      </div>
                  </div>

                  {/* Linha 5: Cronograma Estratégico de Pagamentos */}
                  <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10">
                      <h3 className="text-orange-400 text-xl font-bold mb-6 uppercase tracking-widest flex items-center gap-3">
                        <CalendarDays className="w-5 h-5" /> Planilha de Pagamentos (Desembolso)
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-lg font-light text-gray-300 text-left">
                          <thead>
                            <tr className="border-b-2 border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                              <th className="py-3 px-4">Fase / Natureza</th>
                              <th className="py-3 px-4">Maturidade / Parcela</th>
                              <th className="py-3 px-4 text-right">Valor Final</th>
                              {dividirCartoes && (pagamentoLicenca === "50-10x" || pagamentoLicenca === "20-10x") && (
                                <th className="py-3 px-4 text-right text-gray-500">Divisão Opcional (Cartão)</th>
                              )}
                              <th className="py-3 px-4 text-right">Percurso Financeiro</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const rows = []
                              const valorLicencaBase = 16000 + (numLojas - 1) * 6000

                              // Lógica Licenciamento
                              if (pagamentoLicenca === "vista") {
                                rows.push(
                                  <tr key="licenca-vista" className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-3 px-4 font-semibold text-white">Licenciamento</td>
                                    <td className="py-3 px-4">À Vista</td>
                                    <td className="py-3 px-4 text-right font-bold text-orange-400">{formatCurrency(valorLicencaBase)}</td>
                                    {dividirCartoes && (pagamentoLicenca === "50-10x" || pagamentoLicenca === "20-10x") && (<td className="py-3 px-4 text-right">-</td>)}
                                    <td className="py-3 px-4 text-right">Assinatura de Contrato</td>
                                  </tr>
                                )
                              } else {
                                const splitMap: Record<string, number> = { "50-10x": 0.5, "20-10x": 0.2, "30-10x": 0.3 }
                                const percEntrada = splitMap[pagamentoLicenca] || 0
                                rows.push(
                                  <tr key="licenca-entrada" className="border-b border-white/5 hover:bg-white/5 mt-2">
                                    <td className="py-3 px-4 font-semibold text-white">Licenciamento</td>
                                    <td className="py-3 px-4">Ato Inicial ({percEntrada * 100}%)</td>
                                    <td className="py-3 px-4 text-right font-bold text-orange-400">{formatCurrency(valorLicencaBase * percEntrada)}</td>
                                    {dividirCartoes && (pagamentoLicenca === "50-10x" || pagamentoLicenca === "20-10x") && (
                                      <td className="py-3 px-4 text-right text-gray-400">{formatCurrency((valorLicencaBase * percEntrada) / 2)}</td>
                                    )}
                                    <td className="py-3 px-4 text-right">Assinatura de Contrato</td>
                                  </tr>
                                )
                                
                                const valorRestante = valorLicencaBase * (1 - percEntrada)
                                const valorParcela = pagamentoLicenca === "30-10x" ? calcularParcelaComJuros(valorRestante, 10, 3.99) : valorRestante / 10

                                for (let i = 0; i < 10; i++) {
                                  rows.push(
                                    <tr key={`licenca-parcela-${i}`} className="border-b border-white/5 hover:bg-white/5 mx-2 text-base text-gray-400">
                                      <td className="py-2 px-4 pl-8 border-l border-white/10">Licenciamento (Amortização)</td>
                                      <td className="py-2 px-4">Parcela {i + 1}/10</td>
                                      <td className="py-2 px-4 text-right text-orange-300">{formatCurrency(valorParcela)}</td>
                                      {dividirCartoes && (pagamentoLicenca === "50-10x" || pagamentoLicenca === "20-10x") && (
                                        <td className="py-2 px-4 text-right text-gray-500">{formatCurrency(valorParcela / 2)}</td>
                                      )}
                                      <td className="py-2 px-4 text-right">Mês {i + 1}</td>
                                    </tr>
                                  )
                                }
                              }

                              // Lógica Montagem
                              if (pagamentoMontagem === "vista") {
                                rows.push(
                                  <tr key="montagem-vista" className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-3 px-4 font-semibold text-white mt-4 border-t border-white/20">Montagem & Instalação</td>
                                    <td className="py-3 px-4 mt-4 border-t border-white/20">À Vista</td>
                                    <td className="py-3 px-4 text-right font-bold text-gray-100 mt-4 border-t border-white/20">{formatCurrency(valorMontagemTotal)}</td>
                                    {dividirCartoes && (pagamentoLicenca === "50-10x" || pagamentoLicenca === "20-10x") && (<td className="py-3 px-4 text-right mt-4 border-t border-white/20">-</td>)}
                                    <td className="py-3 px-4 text-right mt-4 border-t border-white/20">Liberação de Obras</td>
                                  </tr>
                                )
                              } else {
                                const nStr = pagamentoMontagem.replace("x", "")
                                const numP = parseInt(nStr)
                                const vParcelaMontagem = calcularParcelaMontagem(valorMontagemTotal, numP)
                                
                                rows.push(
                                  <tr key="montagem-header" className="hover:bg-white/5">
                                    <td className="py-3 px-4 font-semibold text-white mt-4 border-t border-white/20" colSpan={dividirCartoes ? 5 : 4}>
                                       <div className="flex items-center gap-2 text-orange-400 uppercase tracking-widest text-sm">
                                         <Wrench className="w-4 h-4" /> Montagem & Instalação (Financiada em {numP}x)
                                       </div>
                                    </td>
                                  </tr>
                                )

                                for (let i = 0; i < numP; i++) {
                                  rows.push(
                                    <tr key={`montagem-parcela-${i}`} className="border-b border-white/5 hover:bg-white/5 mx-2 text-base text-gray-400">
                                      <td className="py-2 px-4 pl-8 border-l border-white/10">Capex (Instalações)</td>
                                      <td className="py-2 px-4">Parcela {i + 1}/{numP}</td>
                                      <td className="py-2 px-4 text-right text-gray-300">{formatCurrency(vParcelaMontagem)}</td>
                                      {dividirCartoes && (pagamentoLicenca === "50-10x" || pagamentoLicenca === "20-10x") && (<td className="py-2 px-4 text-right">-</td>)}
                                      <td className="py-2 px-4 text-right">Mês {i + 1} Pós Obra</td>
                                    </tr>
                                  )
                                }
                              }

                              return rows
                            })()}
                          </tbody>
                        </table>
                      </div>
                  </div>

                </div>

                {/* Footer do Slide */}
                <div className="border-t border-white/10 pt-6 flex justify-between items-start text-xs text-gray-500 relative z-10 mt-8 gap-10 leading-relaxed font-light">
                  <div className="flex-1">
                     <p className="font-bold uppercase tracking-widest text-orange-400 mb-2">Aviso Legal</p>
                     <p>Os valores de faturamento e lucro apresentados nesta proposta representam <strong>projeções estimativas</strong> elaboradas com base no histórico performático atual da nossa rede de franqueados e licenciados no mesmo segmento. Fatores mercadológicos, empenho gestional, demografia local e variações em custos indiretos podem influenciar fortemente a performance real da operação, não existindo promessa ou garantia de resultados fixos pré-determinados.</p>
                  </div>
                  <div className="text-right font-bold uppercase tracking-widest shrink-0">
                    <p className="text-white mb-1 text-sm tracking-widest">InHouse Market © {new Date().getFullYear()}</p>
                    <p className="text-orange-500">inhousemarket.com.br</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
