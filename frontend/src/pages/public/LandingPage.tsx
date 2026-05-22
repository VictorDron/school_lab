import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Archive,
  BarChart3,
  Check,
  ClipboardCheck,
  DollarSign,
  FileText,
  GraduationCap,
  MessageCircle,
  MessageSquare,
  Plus,
  ShoppingCart,
  Smartphone,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import Mark from '@/components/brand/Mark';
import LeadCaptureModal, { LeadIntent } from '@/components/marketing/LeadCaptureModal';

const PILLARS = [
  {
    num: 'i.',
    title: 'O acadêmico',
    italic: ' inteiro',
    body: 'Matrículas, notas, frequência e portal do aluno em uma só base. Sem planilhas paralelas. Sem retrabalho.',
  },
  {
    num: 'ii.',
    title: 'A admissão',
    italic: ' viva',
    body: 'Funil de leads, formulários públicos, gates aprovativos e onboarding integrados ao sistema da escola.',
  },
  {
    num: 'iii.',
    title: 'O documento',
    italic: ' assinado',
    body: 'GED com versionamento, níveis de segurança e assinatura digital nativa. LGPD desde a fundação.',
  },
  {
    num: 'iv.',
    title: 'O dado',
    italic: ' executivo',
    body: 'Dashboards prontos de inadimplência, evasão, ocupação e indicadores pedagógicos. Multi-unidade consolidado.',
  },
];

const EMERALD = '#15B886';
const EMERALD_DEEP = '#0F8E69';
const CORAL = '#E07A5F';
const AGENTE_LAB_URL = 'https://www.agentelab.com.br/';

interface ModuleItem {
  id: string;
  icon: LucideIcon;
  pre?: string;
  italic: string;
  post?: string;
  desc: string;
  tags: string[];
}

interface ModuleGroup {
  num: string;
  pre: string;
  italic: string;
  desc: string;
  modules: ModuleItem[];
}

const MODULE_GROUPS: ModuleGroup[] = [
  {
    num: 'i.',
    pre: 'Captação e',
    italic: ' relacionamento',
    desc: 'Onde a família encontra a escola, onde a escola fala com a família, e onde o aluno vive o dia a dia.',
    modules: [
      {
        id: '01',
        icon: MessageCircle,
        italic: 'CRM',
        desc: 'Acompanha cada família interessada desde o primeiro contato até a matrícula. Formulário online, geração automática do contrato e envio para assinador online integrado. Indicadores de campanha por canal.',
        tags: ['Captação', 'Contrato', 'Conversão'],
      },
      {
        id: '04',
        icon: MessageSquare,
        italic: 'Comunicação',
        desc: 'Comunicados oficiais para famílias, conversas internas entre coordenação e professores, notificações com registro de leitura. Tudo num só lugar, com histórico auditável.',
        tags: ['Comunicados', 'Mensagens', 'Histórico'],
      },
      {
        id: '12',
        icon: Smartphone,
        pre: 'Portal do ',
        italic: 'Aluno',
        desc: 'App família/aluno com boletim, comunicados, documentos, financeiro consolidado. Cada família com tudo da vida escolar do filho na palma da mão, sem ligar pra secretaria.',
        tags: ['App família', 'Boletim', 'Financeiro'],
      },
    ],
  },
  {
    num: 'ii.',
    pre: 'Operação',
    italic: ' acadêmica',
    desc: 'O ciclo completo do aluno na escola — da matrícula ao histórico, passando pelo dia a dia pedagógico e burocrático.',
    modules: [
      {
        id: '02',
        icon: GraduationCap,
        pre: 'Acadêmico / ',
        italic: 'Pedagógico',
        desc: 'Diário de classe, plano de aula, lançamento de notas e frequência, boletins automáticos, gestão de turmas e séries. O coração pedagógico da escola, sem papel.',
        tags: ['Diários', 'Boletins', 'Histórico'],
      },
      {
        id: '06',
        icon: FileText,
        pre: 'Secretaria e ',
        italic: 'Documentos',
        desc: 'Declarações e históricos emitidos com poucos cliques. Geração automática de declaração escolar, declaração de pagamento, atestados. A secretaria livre do operacional repetitivo.',
        tags: ['Declarações', 'Histórico', 'Geração automática'],
      },
      {
        id: '07',
        icon: ClipboardCheck,
        italic: 'Matrícula',
        post: ' digital',
        desc: 'Formulário de matrícula online completo, entrega digital de documentos pelas famílias, geração automática do contrato e assinatura eletrônica integrada com assinador online (ZapSign, DocuSign, Clicksign ou outro). Fim do processo em papel.',
        tags: ['Formulário', 'Assinatura integrada', 'Documentos'],
      },
      {
        id: '09',
        icon: Users,
        pre: 'Gestão de ',
        italic: 'Alunos',
        desc: 'Cada aluno com prontuário completo: dados, responsáveis, histórico, documentos, ocorrências, desempenho consolidado. Tudo o que a escola sabe sobre cada aluno em uma tela só.',
        tags: ['Prontuário', 'Histórico', 'Ocorrências'],
      },
    ],
  },
  {
    num: 'iii.',
    pre: 'Gestão e',
    italic: ' administração',
    desc: 'A camada que dá visão e controle pra direção: análise de dados, pessoas, patrimônio, documentos institucionais e o painel da escola inteira.',
    modules: [
      {
        id: '03',
        icon: DollarSign,
        pre: 'Gestão ',
        italic: 'Financeira',
        desc: 'Camada de análise de dados sobre o financeiro da escola. Lê informações do sistema de cobrança que a escola já usa, do CRM, do acadêmico — e transforma em painéis de decisão para a diretoria. Visão consolidada de receita por turma e série, controle de bolsas e descontos, projeção de fluxo. Não emite boleto nem PIX: faz o financeiro virar visível.',
        tags: ['Análise', 'Painéis', 'Integração'],
      },
      {
        id: '05',
        icon: BarChart3,
        italic: 'Dashboards',
        desc: 'Painéis para a diretoria com números em tempo real. Análise de evasão, retenção, desempenho pedagógico, visão financeira consolidada. A escola inteira de relance.',
        tags: ['Painéis', 'Tempo real', 'Decisão'],
      },
      {
        id: '08',
        icon: ShoppingCart,
        pre: 'Compras e ',
        italic: 'Patrimônio',
        desc: 'Pedidos de compra com fluxo de aprovação, cotações com fornecedores, inventário do patrimônio com QR Code. A administração da escola sob controle, sem planilha paralela.',
        tags: ['Compras', 'Aprovação', 'Patrimônio'],
      },
      {
        id: '10',
        icon: UserCog,
        pre: 'Gestão de ',
        italic: 'Time',
        desc: 'Equipe pedagógica e administrativa num só lugar: cadastro completo, permissões claras de acesso, ponto, escalas de aulas, cargos e setores, avaliações de desempenho. Controle administrativo central.',
        tags: ['Equipe', 'Permissões', 'Ponto e escalas'],
      },
      {
        id: '11',
        icon: Archive,
        italic: 'GED',
        post: ' — Documentos',
        desc: 'Arquivo digital central — contratos, atas, autorizações, RH, jurídico. Busca inteligente, controle de versão, envio para assinador online integrado quando o documento precisar de assinatura.',
        tags: ['Arquivo', 'Busca', 'Versão'],
      },
    ],
  },
];

function ModuleRow({ m }: { m: ModuleItem }) {
  const [open, setOpen] = useState(false);
  const Icon = m.icon;
  return (
    <div
      className="border-b border-rule transition-colors"
      style={{ background: open ? 'rgba(21,184,134,0.06)' : 'transparent' }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full grid items-center text-left py-5 px-4 lg:px-6 gap-4 lg:gap-6"
        style={{ gridTemplateColumns: '72px 36px 1fr 24px' }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-deep">
          — {m.id}
        </span>
        <span
          className="flex items-center justify-center rounded-md transition-colors"
          style={{
            width: 36,
            height: 36,
            background: open ? EMERALD : 'var(--ink)',
            color: 'var(--paper)',
          }}
        >
          <Icon className="w-[18px] h-[18px]" strokeWidth={1.6} />
        </span>
        <span
          className="font-display font-light"
          style={{
            fontSize: 22,
            letterSpacing: '-0.02em',
            color: open ? EMERALD_DEEP : 'var(--ink)',
            fontVariationSettings: '"opsz" 144, "SOFT" 50',
          }}
        >
          {m.pre}
          <em
            className="display-em"
            style={{ color: open ? EMERALD_DEEP : EMERALD }}
          >
            {m.italic}
          </em>
          {m.post}
        </span>
        <Plus
          className="w-4 h-4 transition-transform text-stone-deep"
          strokeWidth={2}
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        style={{ overflow: 'hidden' }}
      >
        <div className="pb-7 pt-1 px-4 lg:px-6" style={{ paddingLeft: 'clamp(96px, 8vw, 124px)' }}>
          <p className="text-sm leading-relaxed text-ink-soft max-w-[760px] mb-4">{m.desc}</p>
          <div className="flex flex-wrap gap-2">
            {m.tags.map((t) => (
              <span
                key={t}
                className="font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(21,184,134,0.10)',
                  color: EMERALD_DEEP,
                  border: `1px solid rgba(21,184,134,0.22)`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ModulesSection() {
  return (
    <section id="modulos" className="py-32 border-b border-ink">
      <div className="grid lg:grid-cols-[240px_1fr] gap-14 items-end mb-20">
        <div className="font-display italic font-light leading-none" style={{ fontSize: 80, letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
          iv.
          <small className="block font-mono text-[10px] not-italic font-medium uppercase tracking-[0.20em] text-stone-deep mt-3" style={{ fontSize: 10, fontWeight: 500 }}>
            Os módulos
          </small>
        </div>
        <div>
          <h2 className="display-h2">
            A operação da escola,<br />
            <em className="display-em" style={{ color: EMERALD }}>conectada</em> de ponta a ponta.
          </h2>
          <p className="lede mt-6 max-w-[760px]">
            Cada módulo cobre uma área da operação por inteiro. A escola monta o pacote que faz
            sentido — sem pagar por usuário, sem pagar por módulo. A direção tem visão completa,
            com os fluxos críticos integrados.
          </p>
        </div>
      </div>

      <div className="space-y-16">
        {MODULE_GROUPS.map((g) => (
          <div key={g.num}>
            <div className="grid lg:grid-cols-[60px_1fr] gap-4 lg:gap-8 mb-6 items-baseline">
              <div
                className="font-display italic font-light"
                style={{
                  fontSize: 28,
                  letterSpacing: '-0.02em',
                  color: EMERALD,
                  fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1',
                }}
              >
                {g.num}
              </div>
              <div>
                <h3
                  className="font-display font-light"
                  style={{
                    fontSize: 'clamp(22px, 2.4vw, 30px)',
                    letterSpacing: '-0.02em',
                    fontVariationSettings: '"opsz" 144, "SOFT" 50',
                  }}
                >
                  {g.pre}
                  <em className="display-em">{g.italic}</em>
                </h3>
                <p className="text-sm text-stone-deep mt-2 max-w-[760px]">{g.desc}</p>
              </div>
            </div>
            <div className="border-t border-ink">
              {g.modules.map((m) => (
                <ModuleRow key={m.id} m={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function Calculadora({ onCta }: { onCta: (intent: LeadIntent) => void }) {
  const [students, setStudents] = useState(400);
  const [mensalidade, setMensalidade] = useState(900);

  const calc = useMemo(() => {
    const familiasPerdidas = Math.max(1, Math.round(students / 50));
    const matriculasPerdaMes = familiasPerdidas * mensalidade;
    const totalAno = matriculasPerdaMes * 12;
    const pessoasSecretaria =
      students <= 250 ? 3 : students <= 500 ? 4 : students <= 800 ? 6 : students <= 1200 ? 7 : 9;
    const horasMes = pessoasSecretaria * 44;
    return { familiasPerdidas, matriculasPerdaMes, totalAno, pessoasSecretaria, horasMes };
  }, [students, mensalidade]);

  return (
    <section
      id="calculadora"
      className="py-28 lg:py-36 border-b border-ink relative"
      style={{ background: 'var(--ink)', color: 'var(--paper)', marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}
    >
      <div className="max-w-[1320px] mx-auto px-8 lg:px-14">

        {/* head */}
        <div className="grid lg:grid-cols-[240px_1fr] gap-14 items-end mb-20">
          <div className="font-display italic font-light leading-none" style={{ fontSize: 80, letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
            i.
            <small className="block font-mono text-[10px] not-italic font-medium uppercase tracking-[0.20em] mt-3" style={{ color: 'rgba(244,242,236,0.55)' }}>
              O custo
            </small>
          </div>
          <div>
            <h2 className="display-h2" style={{ color: 'var(--paper)' }}>
              Quanto sua escola<br />
              <em className="display-em" style={{ color: EMERALD }}>perde</em> por mês.
            </h2>
            <p className="lede mt-6 max-w-[680px]" style={{ color: 'rgba(244,242,236,0.7)' }}>
              A maior parte das escolas não sabe quanto dinheiro escapa pela operação ineficiente —
              porque a perda nunca aparece num único lugar. Aqui está a estimativa, baseada em médias
              de escolas particulares brasileiras de porte médio.
            </p>
          </div>
        </div>

        {/* inputs */}
        <div className="grid md:grid-cols-2 gap-14 pb-16 border-b" style={{ borderColor: 'rgba(244,242,236,0.12)' }}>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.18em] mb-5" style={{ color: 'rgba(244,242,236,0.55)' }}>
              Quantos alunos sua escola tem hoje?
            </label>
            <div className="flex items-baseline gap-4">
              <input
                type="number"
                min={100}
                max={3000}
                step={50}
                value={students}
                onChange={(e) => setStudents(clamp(parseInt(e.target.value || '0', 10) || 0, 100, 3000))}
                className="bg-transparent border-0 outline-none font-display italic font-light p-0 w-[160px]"
                style={{
                  color: EMERALD,
                  fontSize: 72,
                  letterSpacing: '-0.04em',
                  borderBottom: `2px solid ${EMERALD}`,
                  fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1',
                }}
                inputMode="numeric"
              />
              <span className="font-display italic font-light" style={{ color: 'rgba(244,242,236,0.5)', fontSize: 22 }}>
                alunos
              </span>
            </div>
            <div className="mt-6 max-w-[480px]">
              <input
                type="range"
                min={200}
                max={1500}
                step={50}
                value={clamp(students, 200, 1500)}
                onChange={(e) => setStudents(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer outline-none"
                style={{ accentColor: EMERALD }}
              />
              <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'rgba(244,242,236,0.4)' }}>
                <span>200</span><span>500</span><span>1.000</span><span>1.500+</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.18em] mb-5" style={{ color: 'rgba(244,242,236,0.55)' }}>
              Mensalidade média
            </label>
            <div className="flex items-baseline gap-3">
              <span className="font-display italic font-light" style={{ color: 'rgba(244,242,236,0.5)', fontSize: 28 }}>R$</span>
              <input
                type="number"
                min={200}
                max={10000}
                step={50}
                value={mensalidade}
                onChange={(e) => setMensalidade(clamp(parseInt(e.target.value || '0', 10) || 0, 200, 10000))}
                className="bg-transparent border-0 outline-none font-display italic font-light p-0 w-[220px]"
                style={{
                  color: EMERALD,
                  fontSize: 72,
                  letterSpacing: '-0.04em',
                  borderBottom: `2px solid ${EMERALD}`,
                  fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1',
                }}
                inputMode="numeric"
              />
            </div>
            <div className="mt-6 max-w-[480px]">
              <input
                type="range"
                min={200}
                max={5000}
                step={50}
                value={clamp(mensalidade, 200, 5000)}
                onChange={(e) => setMensalidade(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer outline-none"
                style={{ accentColor: EMERALD }}
              />
              <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'rgba(244,242,236,0.4)' }}>
                <span>R$ 200</span><span>R$ 1.500</span><span>R$ 3.000</span><span>R$ 5.000+</span>
              </div>
            </div>
          </div>
        </div>

        {/* hero number */}
        <div className="py-16 border-b text-center" style={{ borderColor: 'rgba(244,242,236,0.12)' }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] mb-4" style={{ color: 'rgba(244,242,236,0.55)' }}>
            — Perda mensal estimada
          </div>
          <motion.div
            key={calc.matriculasPerdaMes}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="font-display italic font-light"
            style={{
              color: EMERALD,
              fontSize: 'clamp(56px, 10vw, 128px)',
              letterSpacing: '-0.045em',
              lineHeight: 0.95,
              fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1',
            }}
          >
            {formatBRL(calc.matriculasPerdaMes)}<span style={{ color: 'rgba(244,242,236,0.4)', fontSize: '0.4em' }}>/mês</span>
          </motion.div>
          <div className="mt-6 font-display italic font-light max-w-[640px] mx-auto" style={{ color: 'rgba(244,242,236,0.65)', fontSize: 18, lineHeight: 1.5 }}>
            ou <strong style={{ color: 'var(--paper)', fontWeight: 500 }}>{formatBRL(calc.totalAno)}/ano</strong> em famílias que não matricularam,
            além de <strong style={{ color: 'var(--paper)', fontWeight: 500 }}>{calc.horasMes}h/mês</strong> da equipe que poderia estar fechando matrícula.
          </div>
        </div>

        {/* compare */}
        <div className="grid md:grid-cols-2 gap-px mt-px" style={{ background: 'rgba(244,242,236,0.12)' }}>
          <div className="p-10" style={{ background: 'var(--ink)' }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] mb-6" style={{ color: CORAL }}>
              — Sua escola hoje
            </div>
            <h3 className="display-h3 mb-8" style={{ color: 'var(--paper)' }}>
              O que está <em className="display-em" style={{ color: CORAL }}>escapando</em> pela operação.
            </h3>
            <div className="space-y-7">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] mb-2" style={{ color: 'rgba(244,242,236,0.55)' }}>
                  Famílias que desistem antes de matricular
                </div>
                <div className="font-display italic font-light" style={{ color: 'var(--paper)', fontSize: 32, letterSpacing: '-0.02em' }}>
                  {formatBRL(calc.matriculasPerdaMes)}
                </div>
                <div className="text-sm mt-1" style={{ color: 'rgba(244,242,236,0.6)' }}>
                  <strong style={{ color: 'var(--paper)', fontWeight: 500 }}>{calc.familiasPerdidas}</strong> famílias/mês somem por demora ou desorganização no atendimento
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] mb-2" style={{ color: 'rgba(244,242,236,0.55)' }}>
                  Tempo da equipe em tarefas repetitivas
                </div>
                <div className="font-display italic font-light" style={{ color: 'var(--paper)', fontSize: 32, letterSpacing: '-0.02em' }}>
                  {calc.horasMes} h/mês
                </div>
                <div className="text-sm mt-1" style={{ color: 'rgba(244,242,236,0.6)' }}>
                  Equivalente a <strong style={{ color: 'var(--paper)', fontWeight: 500 }}>{calc.pessoasSecretaria}</strong> pessoas perdendo 2h/dia em declarações, mensagens e buscas
                </div>
              </div>
            </div>
          </div>

          <div className="p-10" style={{ background: 'var(--ink)' }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] mb-6" style={{ color: EMERALD }}>
              — Sua escola com a agente.school
            </div>
            <h3 className="display-h3 mb-8" style={{ color: 'var(--paper)' }}>
              A escola <em className="display-em" style={{ color: EMERALD }}>cuidando</em> do que importa.
            </h3>
            <div className="space-y-6">
              {[
                {
                  t: 'Famílias acompanhadas até a matrícula',
                  d: 'Cada interessada com cadência humana — do primeiro contato à assinatura no contrato. Nenhuma família esquecida no caminho.',
                },
                {
                  t: 'Secretaria livre do operacional',
                  d: 'Documentos automáticos, busca em segundos, comunicação em massa. A equipe volta a fechar matrícula em vez de apagar incêndio.',
                },
                {
                  t: 'Direção com visão da escola inteira',
                  d: 'O painel com receita, matrícula, atendimentos em tempo real — sem pedir relatório, sem esperar dois dias.',
                },
              ].map((item) => (
                <div key={item.t} className="flex gap-3">
                  <Check className="w-4 h-4 mt-1 flex-shrink-0" strokeWidth={2.5} style={{ color: EMERALD }} />
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] mb-1.5" style={{ color: 'rgba(244,242,236,0.7)' }}>
                      {item.t}
                    </div>
                    <div className="text-sm" style={{ color: 'rgba(244,242,236,0.6)' }}>{item.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* cta */}
        <div className="mt-16 flex flex-col lg:flex-row items-start lg:items-center gap-8 justify-between">
          <p className="font-display italic font-light max-w-[560px]" style={{ color: 'rgba(244,242,236,0.85)', fontSize: 22, lineHeight: 1.45 }}>
            A agente.school foi desenhada exatamente pra{' '}
            <strong style={{ color: 'var(--paper)', fontWeight: 500 }}>resolver esses problemas ao mesmo tempo</strong>.
          </p>
          <button
            onClick={() => onCta('demo')}
            className="btn btn-xl"
            style={{ background: EMERALD, color: 'var(--paper)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = EMERALD_DEEP)}
            onMouseLeave={(e) => (e.currentTarget.style.background = EMERALD)}
          >
            Receber proposta personalizada <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-10 text-sm max-w-[720px]" style={{ color: 'rgba(244,242,236,0.45)' }}>
          Estimativa baseada em médias do setor educacional privado brasileiro. Números variam
          conforme o contexto da sua escola — a proposta personalizada é calculada com dados reais.
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadIntent, setLeadIntent] = useState<LeadIntent>('demo');

  const openLead = (intent: LeadIntent) => {
    setLeadIntent(intent);
    setLeadOpen(true);
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* ============ NAV ============ */}
      <header className="sticky top-0 z-30 glass border-b border-rule">
        <div className="max-w-[1320px] mx-auto px-8 lg:px-14 h-[88px] flex items-center justify-between">
          <Link
            to="/"
            aria-label="agente.school"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Mark size="lg" />
          </Link>
          <nav className="hidden md:flex items-center gap-9 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-stone-deep">
            <a href="#calculadora" className="hover:text-ink transition-colors">Calcular perda</a>
            <a href="#sistema" className="hover:text-ink transition-colors">Sistema</a>
            <a href="#modulos" className="hover:text-ink transition-colors">Módulos</a>
            <a href="#jornada" className="hover:text-ink transition-colors">Jornada</a>
            <a href="#manifesto" className="hover:text-ink transition-colors">Manifesto</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-ghost btn-md hidden sm:inline-flex">Entrar</Link>
            <button onClick={() => openLead('demo')} className="btn btn-primary btn-md">
              Agendar diagnóstico <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1320px] mx-auto px-8 lg:px-14">

        {/* ============ HERO ============ */}
        <section className="pt-20 pb-20 border-b border-ink relative">
          <div className="eyebrow mb-8" style={{ color: '#15B886' }}>
            — Sistema operacional para escolas particulares
          </div>

          <h1 className="display-hero" style={{ maxWidth: 1100 }}>
            Não perca<br />
            <em className="display-em" style={{ color: '#15B886' }}>mais</em><br />
            matrículas.
          </h1>

          <p className="lede mt-9 max-w-[660px]">
            Enquanto a secretaria apaga incêndio, a família que chegou interessada some
            no caminho — e ninguém percebe a tempo.{' '}
            <em className="display-em" style={{ color: '#15B886', fontWeight: 500 }}>
              A agente.school identifica onde sua escola está vazando — e tampa o
              vazamento em 30 dias.
            </em>
          </p>

          <div className="mt-12 flex flex-wrap gap-3">
            <a
              href="#calculadora"
              className="btn btn-xl"
              style={{ background: '#15B886', color: 'var(--paper)' }}
            >
              Calcular quanto minha escola perde <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            </a>
          </div>

          <div className="mt-14 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-deep">
            — Construído com base em operações reais
          </div>
        </section>

        {/* ============ CALCULADORA ============ */}
        <Calculadora onCta={openLead} />

        {/* ============ PROBLEMA ============ */}
        <section id="problema" className="py-32 border-b border-ink">
          <div className="grid lg:grid-cols-[240px_1fr] gap-14 items-end mb-16">
            <div className="font-display italic font-light leading-none" style={{ fontSize: 80, letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
              ii.
              <small className="block font-mono text-[10px] not-italic font-medium uppercase tracking-[0.20em] text-stone-deep mt-3" style={{ fontSize: 10, fontWeight: 500 }}>
                O problema
              </small>
            </div>
            <div>
              <h2 className="display-h2">
                Você <em className="display-em">sabe</em> que está perdendo.<br />
                Só <em className="display-em">não sabe</em> onde.
              </h2>
              <p className="lede mt-6 max-w-[760px]">
                A sensação está lá: a secretaria atolada, a diretoria descobrindo o problema pelo
                telefone, a família que sumiu sem aviso. Mas o problema não aparece num lugar só —
                e por isso passa anos sem solução.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-0 border border-ink">
            {/* BAD column */}
            <div
              className="p-10 lg:p-12 border-b md:border-b-0 md:border-r border-ink"
              style={{ background: 'rgba(224,122,95,0.06)' }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] mb-6" style={{ color: CORAL }}>
                — O que segura o crescimento
              </div>
              <h3 className="display-h3 mb-8">
                A escola está <em className="display-em" style={{ color: CORAL }}>refém</em> da própria rotina.
              </h3>
              <ul className="space-y-4">
                {[
                  'Família interessada espera dias para ser atendida — e desiste',
                  'Aluno em risco de evasão é descoberto tarde demais',
                  'A secretaria atende WhatsApp em vez de fechar matrícula',
                  'A diretoria pede relatório e espera dois dias para receber',
                  'Documento sumiu — meia hora pra encontrar, ou nunca encontra',
                  'Cada nova unidade significa dobrar a equipe administrativa',
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                    <X className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={2.5} style={{ color: CORAL }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* GOOD column */}
            <div
              className="p-10 lg:p-12"
              style={{ background: 'rgba(21,184,134,0.06)' }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] mb-6" style={{ color: EMERALD_DEEP }}>
                — O que destrava o crescimento
              </div>
              <h3 className="display-h3 mb-8">
                A escola pronta para <em className="display-em" style={{ color: EMERALD_DEEP }}>escalar</em>.
              </h3>
              <ul className="space-y-4">
                {[
                  'Cada interessado é atendido em segundos, dia ou noite',
                  'Sinais de evasão chegam à coordenação cedo — a tempo de agir',
                  'A secretaria fecha matrícula em vez de apagar incêndio',
                  'A diretoria abre o painel e enxerga a escola inteira na hora',
                  'Documento certo, encontrado em segundos — ou enviado em massa',
                  'A operação está pronta para a próxima unidade — sem dobrar custo',
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                    <span
                      aria-hidden
                      className="mt-[7px] flex-shrink-0"
                      style={{ width: 6, height: 6, borderRadius: '50%', background: EMERALD }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ============ SISTEMA / PILLARS ============ */}
        <section id="sistema" className="py-32 border-b border-ink">
          <div className="grid lg:grid-cols-[240px_1fr] gap-14 items-end mb-16">
            <div className="font-display italic font-light leading-none" style={{ fontSize: 80, letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
              iii.
              <small className="block font-mono text-[10px] not-italic font-medium uppercase tracking-[0.20em] text-stone-deep mt-3" style={{ fontSize: 10, fontWeight: 500 }}>
                O sistema
              </small>
            </div>
            <div>
              <h2 className="display-h2">
                Quatro <em className="display-em">disciplinas</em>.<br />
                Uma <em className="display-iris">base</em>.
              </h2>
              <p className="lede mt-6 max-w-[680px]">
                A escola não é uma pilha de módulos costurados — é um sistema com regras claras,
                fronteiras explícitas e uma única fonte de verdade.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-ink">
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className={[
                  'p-10 border-b border-rule',
                  i % 2 === 0 ? 'md:border-r border-rule' : '',
                  i >= 2 ? 'md:border-b-0' : '',
                ].join(' ')}
              >
                <div className="flex items-baseline gap-4 mb-5">
                  <span className="font-display italic font-light text-stone-deep" style={{ fontSize: 32, fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
                    {p.num}
                  </span>
                  <h3 className="display-h3">
                    <span className="font-light">{p.title}</span>
                    <em className="display-em">{p.italic}</em>
                    <span className="text-iris">.</span>
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-ink-soft max-w-[520px]">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ============ MÓDULOS ============ */}
        <ModulesSection />

        {/* ============ JORNADA ============ */}
        <section id="jornada" className="py-32 border-b border-ink">
          <div className="grid lg:grid-cols-[240px_1fr] gap-14 items-end mb-20">
            <div className="font-display italic font-light leading-none" style={{ fontSize: 80, letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
              v.
              <small className="block font-mono text-[10px] not-italic font-medium uppercase tracking-[0.20em] text-stone-deep mt-3" style={{ fontSize: 10, fontWeight: 500 }}>
                Jornada
              </small>
            </div>
            <div>
              <h2 className="display-h2">
                Em <em className="display-em" style={{ color: EMERALD }}>30 dias</em>,<br />
                a operação roda.
              </h2>
              <p className="lede mt-6 max-w-[760px]">
                Cronograma de implantação semana a semana. Ao final do mês 1, a escola já opera o
                básico no novo sistema. O resto é evolução contínua. Processo testado em escolas
                de 200 a 800 alunos — não é promessa de proposta, é o que praticamos em campo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'var(--rule)' }}>
            {[
              {
                num: 'i.',
                tag: '— Semana 1',
                pre: '',
                italic: 'Migração',
                post: '',
                body: 'Diagnóstico técnico, mapeamento dos fluxos atuais, importação dos dados (alunos, turmas, financeiro, documentos). Configuração dos módulos contratados.',
              },
              {
                num: 'ii.',
                tag: '— Semana 2',
                pre: '',
                italic: 'Setup',
                post: ' e testes',
                body: 'Sistema configurado, integrações com ferramentas existentes da escola conectadas, testes em paralelo à operação atual. Validação dos dados importados.',
              },
              {
                num: 'iii.',
                tag: '— Semanas 3–4',
                pre: '',
                italic: 'Operação',
                post: '',
                body: 'Equipe treinada, escola já operando o básico no sistema. Diretoria acessando dashboards. Ajustes baseados em uso real. Sustentação ativa.',
              },
              {
                num: 'iv.',
                tag: '— A partir do dia 31',
                pre: '',
                italic: 'Sustentação',
                post: ' contínua',
                body: 'Otimizações mensais conforme uso real, novos módulos quando fizer sentido, evolução acompanhada pela casa. Suporte e relacionamento contínuo.',
              },
            ].map((c, i) => (
              <motion.div
                key={c.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="p-8 lg:p-10 bg-paper"
              >
                <div
                  className="font-display italic font-light leading-none mb-6"
                  style={{
                    fontSize: 48,
                    letterSpacing: '-0.04em',
                    color: EMERALD,
                    fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1',
                  }}
                >
                  {c.num}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-deep mb-3">
                  {c.tag}
                </div>
                <h3
                  className="font-display font-light mb-4"
                  style={{
                    fontSize: 24,
                    letterSpacing: '-0.02em',
                    fontVariationSettings: '"opsz" 144, "SOFT" 50',
                  }}
                >
                  <em className="display-em" style={{ color: EMERALD_DEEP }}>{c.italic}</em>
                  {c.post}
                </h3>
                <p className="text-sm leading-relaxed text-ink-soft">{c.body}</p>
              </motion.div>
            ))}
          </div>

          <div
            className="mt-px p-10 lg:p-12"
            style={{ background: 'rgba(21,184,134,0.06)', border: `1px solid rgba(21,184,134,0.20)` }}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] mb-4" style={{ color: EMERALD_DEEP }}>
              — No fim do mês 1
            </div>
            <p
              className="font-display italic font-light"
              style={{
                fontSize: 'clamp(20px, 2.2vw, 26px)',
                lineHeight: 1.5,
                letterSpacing: '-0.01em',
                fontVariationSettings: '"opsz" 144, "SOFT" 50',
                color: 'var(--ink-soft)',
              }}
            >
              A diretoria entra no painel e vê{' '}
              <em className="display-em" style={{ color: EMERALD_DEEP }}>os fluxos virando</em>.
              Matrículas avançando até a assinatura, secretaria com agenda livre, documentos
              saindo automáticos. Não é projeção — é o que está acontecendo na sua escola, em
              tempo real.
            </p>
          </div>
        </section>

        {/* ============ MANIFESTO ============ */}
        <section id="manifesto" className="py-32 text-center border-b border-ink">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-iris mb-10">
            — Manifesto
          </div>
          <h2 className="display-hero max-w-[1000px] mx-auto" style={{ fontSize: 'clamp(40px, 6vw, 72px)' }}>
            Escola não é uma <em className="display-em" style={{ textDecoration: 'line-through', textDecorationColor: '#6B4FFF', textDecorationThickness: 3 }}>pilha de planilhas</em>.<br />
            Escola é um <span className="display-iris" style={{ background: 'linear-gradient(transparent 70%, rgba(107,79,255,0.18) 70%)', padding: '0 4px' }}>sistema</span> que respira com a operação.
          </h2>
          <p className="lede mt-10 max-w-2xl mx-auto">
            A gente acredita em plataformas únicas, regras explícitas e silêncio bem desenhado.
            Cada decisão de produto passa por essas três peneiras.
          </p>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="py-32">
          <div className="bg-ink text-paper p-16 md:p-24 text-center monolith-grid relative overflow-hidden">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-iris mb-10">
              — Hora de operar
            </div>
            <h2 className="display-hero text-paper" style={{ color: '#F4F2EC', fontSize: 'clamp(36px, 5vw, 64px)' }}>
              Vamos transformar a sua <em className="display-em">escola</em><span className="text-iris">.</span>
            </h2>
            <p className="mt-8 max-w-xl mx-auto text-paper/75 text-base leading-relaxed font-sans">
              Em 30 minutos te mostramos a plataforma com um caso real e desenhamos um plano de
              implantação para a sua realidade.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <button onClick={() => openLead('demo')} className="btn btn-iris btn-xl">
                Agendar diagnóstico <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
              <Link to="/login" className="btn btn-outline-inverted btn-xl">
                Já sou cliente · entrar
              </Link>
            </div>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="pt-24 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr_1.2fr] gap-12 lg:gap-14 pb-16">
            {/* Brand block */}
            <div>
              <Mark size="md" />
              <p
                className="mt-6 font-display italic font-light max-w-[320px]"
                style={{
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: 'var(--ink-soft)',
                  fontVariationSettings: '"opsz" 144, "SOFT" 50',
                }}
              >
                Sistema completo para escolas, cursos e faculdades. Um produto da casa{' '}
                <a
                  href={AGENTE_LAB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:opacity-70 transition-opacity"
                >
                  <em className="display-em" style={{ color: EMERALD_DEEP }}>agente.lab</em>
                </a>
                .
              </p>
            </div>

            {/* O Sistema */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-deep mb-5">
                — O sistema
              </div>
              <ul className="space-y-3 text-[13px]">
                <li><a href="#modulos" className="text-ink hover:opacity-60 transition-opacity">Módulos</a></li>
                <li><a href="#problema" className="text-ink hover:opacity-60 transition-opacity">Como resolve</a></li>
                <li><a href="#sistema" className="text-ink hover:opacity-60 transition-opacity">Disciplinas</a></li>
                <li><a href="#jornada" className="text-ink hover:opacity-60 transition-opacity">Jornada</a></li>
                <li><a href="#manifesto" className="text-ink hover:opacity-60 transition-opacity">Manifesto</a></li>
              </ul>
            </div>

            {/* Para você */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-deep mb-5">
                — Para você
              </div>
              <ul className="space-y-3 text-[13px]">
                <li><a href="#calculadora" className="text-ink hover:opacity-60 transition-opacity">Calcular perda</a></li>
                <li><button onClick={() => openLead('demo')} className="text-ink hover:opacity-60 transition-opacity text-left">Receber proposta</button></li>
                <li>
                  <a
                    href="https://wa.me/5521987934929"
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink hover:opacity-60 transition-opacity inline-flex items-center gap-1.5"
                  >
                    WhatsApp direto
                    <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />
                  </a>
                </li>
                <li><Link to="/login" className="text-ink hover:opacity-60 transition-opacity">Entrar</Link></li>
              </ul>
            </div>

            {/* A casa agente.lab */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-deep mb-5">
                — A casa agente.lab
              </div>
              <ul className="space-y-3 text-[13px]">
                {[
                  { name: 'agente.lab', tag: 'live', tone: 'live' as const, url: AGENTE_LAB_URL },
                  { name: 'agente.school', tag: 'você está aqui', tone: 'here' as const },
                  { name: 'agente.crm', tag: 'em breve', tone: 'soon' as const },
                  { name: 'agente.mkt', tag: 'em breve', tone: 'soon' as const },
                  { name: 'agente.contábil', tag: 'em breve', tone: 'soon' as const },
                ].map((p) => (
                  <li key={p.name} className="flex items-center gap-2.5">
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink hover:opacity-60 transition-opacity inline-flex items-center gap-1"
                      >
                        {p.name}
                        <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />
                      </a>
                    ) : (
                      <span className="text-ink">{p.name}</span>
                    )}
                    <span
                      className="font-mono uppercase tracking-[0.14em] px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: 9,
                        background:
                          p.tone === 'live' ? 'rgba(21,184,134,0.14)'
                          : p.tone === 'here' ? 'var(--ink)'
                          : 'rgba(224,122,95,0.10)',
                        color:
                          p.tone === 'live' ? EMERALD_DEEP
                          : p.tone === 'here' ? 'var(--paper)'
                          : CORAL,
                        border:
                          p.tone === 'live' ? '1px solid rgba(21,184,134,0.22)'
                          : p.tone === 'here' ? 'none'
                          : '1px solid rgba(224,122,95,0.18)',
                      }}
                    >
                      {p.tag}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Big wordmark */}
          <div
            className="font-display font-light text-ink leading-none border-t border-ink pt-12 pb-10"
            style={{
              fontSize: 'clamp(80px, 16vw, 220px)',
              letterSpacing: '-0.06em',
              fontVariationSettings: '"opsz" 144, "SOFT" 50',
            }}
          >
            agente
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: '0.13em',
                height: '0.13em',
                borderRadius: '50%',
                background: EMERALD,
                marginLeft: '0.05em',
                marginRight: '0.08em',
                verticalAlign: 'baseline',
              }}
            />
            <em className="display-em" style={{ color: EMERALD }}>school</em>
          </div>

          {/* Bottom bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3 border-t border-ink pt-8 font-mono text-[10px] uppercase tracking-[0.16em] text-stone-deep">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: EMERALD }}
              />
              <span>Um produto </span>
              <a
                href={AGENTE_LAB_URL}
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink transition-colors"
              >
                agente.lab
              </a>
            </div>
            <div className="md:text-center">
              © {new Date().getFullYear()} · agente.school · todos os direitos reservados
            </div>
            <div className="md:text-right">
              São Paulo · Rio de Janeiro
            </div>
          </div>
        </footer>
      </div>

      <LeadCaptureModal
        open={leadOpen}
        intent={leadIntent}
        onClose={() => setLeadOpen(false)}
      />
    </div>
  );
}
