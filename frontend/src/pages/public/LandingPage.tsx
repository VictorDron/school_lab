import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check } from 'lucide-react';
import Mark from '@/components/brand/Mark';
import LeadCaptureModal, { LeadIntent } from '@/components/marketing/LeadCaptureModal';

interface PricingTier {
  size: number;
  pricePerStudent: number;
  total: number;
  label: string;
}

interface PricingPlan {
  id: 'pequeno' | 'medio' | 'grande' | 'sobmedida';
  num: string;
  name: string;
  italic: string;
  tag: string;
  featured?: boolean;
  badge?: string;
  tiers?: PricingTier[];
  custom?: { headline: string; subline: string };
  intro: string;
  features: string[];
  cta: string;
  ctaIntent: LeadIntent;
}

const PLANS: PricingPlan[] = [
  {
    id: 'pequeno',
    num: '01',
    name: 'pequeno',
    italic: 'essencial',
    tag: 'Para escolas em digitalização',
    intro: 'O essencial',
    tiers: [
      { size: 200, pricePerStudent: 1.99, total: 398, label: 'Até 200 alunos' },
      { size: 400, pricePerStudent: 1.79, total: 716, label: 'Até 400 alunos' },
      { size: 600, pricePerStudent: 1.59, total: 954, label: 'Até 600 alunos' },
    ],
    features: [
      'Gestão de alunos e matrículas',
      'Acadêmico, notas e frequência',
      'Financeiro, boletos e cobrança',
      'Portal do Aluno (web e app)',
      'Comunicação com famílias',
      'Suporte por chat e e-mail',
    ],
    cta: 'Começar',
    ctaIntent: 'pequeno',
  },
  {
    id: 'medio',
    num: '02',
    name: 'médio',
    italic: 'crescente',
    tag: 'Para escolas em crescimento',
    featured: true,
    badge: 'Mais escolhido',
    intro: 'Tudo do Pequeno + crescimento',
    tiers: [
      { size: 200, pricePerStudent: 2.99, total: 598, label: 'Até 200 alunos' },
      { size: 400, pricePerStudent: 2.69, total: 1076, label: 'Até 400 alunos' },
      { size: 600, pricePerStudent: 2.39, total: 1434, label: 'Até 600 alunos' },
    ],
    features: [
      'Admissões e CRM completo',
      'Gestão de Time e perfis',
      'GED com assinatura digital',
      'Compras e Patrimônio',
      'Relatórios pedagógicos',
      'Suporte prioritário',
    ],
    cta: 'Falar com especialista',
    ctaIntent: 'medio',
  },
  {
    id: 'grande',
    num: '03',
    name: 'grande',
    italic: 'inteligente',
    tag: 'Para escolas que operam por dado',
    intro: 'Tudo do Médio + IA e BI',
    tiers: [
      { size: 200, pricePerStudent: 4.49, total: 898, label: 'Até 200 alunos' },
      { size: 400, pricePerStudent: 3.99, total: 1596, label: 'Até 400 alunos' },
      { size: 600, pricePerStudent: 3.49, total: 2094, label: 'Até 600 alunos' },
    ],
    features: [
      'IA integrada (atendimento, evasão)',
      'BI e Dashboards executivos',
      'Customer Success dedicado',
      'SLA reduzido (resposta em 2h)',
      'API e integrações nativas',
      'Treinamento avançado',
    ],
    cta: 'Solicitar demonstração',
    ctaIntent: 'grande',
  },
  {
    id: 'sobmedida',
    num: '04',
    name: 'sob medida',
    italic: 'redes',
    tag: 'Acima de 600 alunos · Redes',
    intro: 'Tudo do Grande + escala',
    custom: {
      headline: 'Vamos conversar',
      subline: 'Contrato consolidado por matriz, com tarifa especial e benefícios exclusivos.',
    },
    features: [
      'BI Multi-unidade consolidado',
      'Account Manager dedicado',
      'SLA premium 24/7',
      'Implantação em fases',
      'App white-label da rede',
      'Treinamento on-site',
    ],
    cta: 'Agendar conversa',
    ctaIntent: 'sobmedida',
  },
];

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

function PlanCard({ plan, onCta }: { plan: PricingPlan; onCta: (i: LeadIntent) => void }) {
  const [tierIdx, setTierIdx] = useState(0);
  const tier = plan.tiers?.[tierIdx];
  const featured = !!plan.featured;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4 }}
      className={[
        'relative flex flex-col p-8',
        featured ? 'bg-ink text-paper' : 'bg-paper',
        'border',
        featured ? 'border-ink' : 'border-ink',
      ].join(' ')}
      style={{ minHeight: 540 }}
    >
      {/* Plan number — top-left corner like a chapter */}
      <div className="flex items-baseline justify-between mb-8">
        <span
          className={[
            'font-mono text-[10px] font-semibold uppercase tracking-[0.18em]',
            featured ? 'text-iris' : 'text-stone-deep',
          ].join(' ')}
        >
          — {plan.num} · {plan.tag}
        </span>
        {plan.badge && (
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] px-2 py-1 rounded-full" style={{ background: '#6B4FFF', color: '#F4F2EC' }}>
            ● {plan.badge}
          </span>
        )}
      </div>

      <h3 className="display-h3" style={featured ? { color: '#F4F2EC' } : undefined}>
        <span className="font-light">{plan.name}</span>
        <span className="display-em" style={featured ? { color: '#6B4FFF' } : { color: 'var(--iris)' }}>
          {' '}/ {plan.italic}
        </span>
      </h3>

      {plan.tiers && tier ? (
        <>
          <div className="mt-7">
            <label className={['caption block mb-2', featured ? 'text-paper/60' : ''].join(' ')}>
              — Quantos alunos
            </label>
            <div className="relative">
              <select
                value={tierIdx}
                onChange={(e) => setTierIdx(parseInt(e.target.value, 10))}
                className={[
                  'w-full px-4 py-3 pr-10 text-sm font-semibold appearance-none cursor-pointer transition-colors',
                  'border focus:outline-none',
                  featured
                    ? 'bg-paper text-ink border-paper'
                    : 'bg-paper text-ink border-ink hover:border-iris',
                ].join(' ')}
                style={{ borderRadius: 4 }}
              >
                {plan.tiers.map((t, i) => (
                  <option key={t.size} value={i}>{t.label}</option>
                ))}
              </select>
              <span
                aria-hidden
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-2/3 w-2 h-2 border-r-2 border-b-2 rotate-45"
                style={{ borderColor: '#0E0D0B' }}
              />
            </div>
          </div>

          <div
            className="mt-6 py-5 border-t border-b"
            style={{ borderColor: featured ? 'rgba(244,242,236,0.15)' : 'var(--rule)' }}
          >
            <div className={['caption mb-2', featured ? 'text-paper/60' : ''].join(' ')}>
              — Mensal
            </div>
            <div className="flex items-baseline">
              <span className={['font-display font-light text-2xl', featured ? 'text-paper' : 'text-ink'].join(' ')} style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
                R$
              </span>
              <span
                className={['font-display font-light leading-none ml-2', featured ? 'text-paper' : 'text-ink'].join(' ')}
                style={{ fontSize: '52px', letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
              >
                {tier.total.toLocaleString('pt-BR')}
              </span>
              <span className={['ml-2 text-xs', featured ? 'text-paper/60' : 'text-stone-deep'].join(' ')}>
                /mês
              </span>
            </div>
            <div className={['mt-3 text-xs', featured ? 'text-paper/70' : 'text-stone-deep'].join(' ')}>
              <em className="serif-em">≈ R$ {tier.pricePerStudent.toFixed(2).replace('.', ',')}</em>{' '}
              por aluno
            </div>
          </div>
        </>
      ) : (
        plan.custom && (
          <div
            className="mt-7 py-5 border-t border-b"
            style={{ borderColor: featured ? 'rgba(244,242,236,0.15)' : 'var(--rule)' }}
          >
            <div className={['caption mb-2', featured ? 'text-paper/60' : ''].join(' ')}>
              — Investimento
            </div>
            <div
              className={['font-display font-light leading-none', featured ? 'text-paper' : 'text-ink'].join(' ')}
              style={{ fontSize: '40px', letterSpacing: '-0.035em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
            >
              <em className="display-em">{plan.custom.headline}</em>
            </div>
            <p className={['mt-3 text-xs leading-relaxed', featured ? 'text-paper/70' : 'text-stone-deep'].join(' ')}>
              {plan.custom.subline}
            </p>
          </div>
        )
      )}

      <ul className="space-y-2.5 mt-6 mb-7 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className={['flex items-start gap-2.5 text-[13px] leading-relaxed', featured ? 'text-paper/85' : 'text-ink-soft'].join(' ')}>
            <Check
              className="w-3.5 h-3.5 mt-1 flex-shrink-0"
              strokeWidth={3}
              style={{ color: featured ? '#6B4FFF' : 'var(--iris)' }}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onCta(plan.ctaIntent)}
        className={[
          'w-full inline-flex items-center justify-between px-5 py-3.5 text-sm font-semibold transition-all group',
          featured
            ? 'bg-paper text-ink hover:bg-iris hover:text-paper'
            : 'bg-ink text-paper hover:bg-iris',
        ].join(' ')}
        style={{ borderRadius: 4, letterSpacing: '0.01em' }}
      >
        <span>{plan.cta}</span>
        <ArrowUpRight className="w-4 h-4 transition-transform group-hover:rotate-45" strokeWidth={2.5} />
      </button>
    </motion.article>
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
        <div className="max-w-[1320px] mx-auto px-8 lg:px-14 h-[68px] flex items-center justify-between">
          <Link to="/" aria-label="agente school">
            <Mark size="sm" />
          </Link>
          <nav className="hidden md:flex items-center gap-9 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-stone-deep">
            <a href="#sistema" className="hover:text-ink transition-colors">Sistema</a>
            <a href="#planos" className="hover:text-ink transition-colors">Planos</a>
            <a href="#manifesto" className="hover:text-ink transition-colors">Manifesto</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-ghost btn-md hidden sm:inline-flex">Entrar</Link>
            <button onClick={() => openLead('demo')} className="btn btn-primary btn-md">
              Agendar demo <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1320px] mx-auto px-8 lg:px-14">

        {/* ============ TOPBAR (manifesto-style meta) ============ */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-center py-7 border-b border-ink font-mono text-[11px] uppercase tracking-[0.06em] gap-2">
          <div className="text-stone-deep">— Sistema operacional para escolas · v1</div>
          <div className="serif-em text-stone-deep text-center" style={{ textTransform: 'none', fontSize: 14 }}>
            — Disciplina, integração, e silêncio bem desenhado —
          </div>
          <div className="text-right text-stone-deep">
            Em operação <span className="text-iris">●</span> live
          </div>
        </div>

        {/* ============ HERO ============ */}
        <section className="pt-24 pb-20 border-b border-ink relative">
          <div className="eyebrow eyebrow-ink mb-9">— Vol. 01 · A escola operada</div>

          <h1 className="display-hero">
            Toda a escola.<br />
            Um <em className="display-em">sistema</em><span className="display-iris">.</span>
          </h1>

          <p className="lede mt-9 max-w-[720px]">
            Acadêmico, financeiro, admissões, documentos, comunicação e BI numa base só.
            Multi-tenant com Row-Level Security no banco. Conforme LGPD desde a fundação.
            <br />
            <span className="not-italic font-sans text-ink-soft text-base">Não é um conjunto de módulos — é uma plataforma única.</span>
          </p>

          <div className="mt-12 flex flex-wrap gap-3">
            <button onClick={() => openLead('demo')} className="btn btn-primary btn-xl">
              Agendar demonstração <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <a href="#planos" className="btn btn-outline btn-xl">Ver planos</a>
          </div>

          {/* Hero meta — manifesto grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 mt-20 border-t border-ink">
            {[
              { label: 'Disciplina', value: 'Plataforma única' },
              { label: 'Arquitetura', value: 'Multi-tenant + RLS' },
              { label: 'Voz',         value: 'Direto · Confiante · Quieto' },
              { label: 'Status',      value: 'Em operação · v1' },
            ].map((m, i) => (
              <div
                key={m.label}
                className={[
                  'py-7 pr-6 font-mono text-[10px] uppercase tracking-[0.10em] text-stone-deep',
                  i === 0 ? '' : 'md:pl-6',
                  i < 3 ? 'md:border-r border-rule' : '',
                ].join(' ')}
              >
                <strong className="serif-em block text-ink mb-1.5" style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em', textTransform: 'none', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
                  {m.value}
                </strong>
                {m.label}
              </div>
            ))}
          </div>
        </section>

        {/* ============ SISTEMA / PILLARS ============ */}
        <section id="sistema" className="py-32 border-b border-ink">
          <div className="grid lg:grid-cols-[240px_1fr] gap-14 items-end mb-16">
            <div className="font-display italic font-light leading-none" style={{ fontSize: 80, letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
              i.
              <small className="block font-mono text-[10px] not-italic font-medium uppercase tracking-[0.20em] text-stone-deep mt-3" style={{ fontSize: 10, fontWeight: 500 }}>
                The system
              </small>
            </div>
            <div>
              <h2 className="display-h2">
                Quatro <em className="display-em">disciplinas</em>.<br />
                Uma <em className="display-iris">base</em>.
              </h2>
              <p className="lede mt-6 max-w-[680px]">
                A escola não é uma pilha de módulos costurados — é um sistema com regras claras,
                fronteiras explícitas, e uma única fonte de verdade.
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

        {/* ============ MONOLITH (mark showcase) ============ */}
        <section className="py-2 -mx-8 lg:-mx-14">
          <div className="bg-ink monolith-grid relative overflow-hidden px-6 py-16 sm:px-12 sm:py-24 lg:px-20 lg:py-[120px]">
            <div className="flex items-center justify-center">
              <Mark size="xl" inverted pulse />
            </div>
            <div className="mt-10 sm:mt-0 sm:absolute sm:bottom-7 sm:left-12 sm:right-12 lg:left-20 lg:right-20 flex flex-col sm:flex-row gap-2 sm:gap-4 sm:justify-between font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.12em] text-center sm:text-left" style={{ color: 'rgba(244,242,236,0.5)' }}>
              <span><strong className="text-paper font-medium">Mark</strong> · Inter custom-tuned</span>
              <span className="hidden sm:inline">8pt baseline · grid 80px</span>
              <span><strong className="text-paper font-medium">Dot</strong> · Iris #6B4FFF</span>
            </div>
          </div>
        </section>

        {/* ============ PLANOS ============ */}
        <section id="planos" className="py-32 border-b border-ink">
          <div className="grid lg:grid-cols-[240px_1fr] gap-14 items-end mb-16">
            <div className="font-display italic font-light leading-none" style={{ fontSize: 80, letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
              ii.
              <small className="block font-mono text-[10px] not-italic font-medium uppercase tracking-[0.20em] text-stone-deep mt-3" style={{ fontSize: 10, fontWeight: 500 }}>
                The plans
              </small>
            </div>
            <div>
              <h2 className="display-h2">
                Escolha o plano da sua <em className="display-iris">escola</em>.
              </h2>
              <p className="lede mt-6 max-w-[680px]">
                Selecione a quantidade de alunos da sua instituição e veja o investimento mensal
                exato. Sem cálculos, sem surpresas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 -mx-px">
            {PLANS.map((p) => (
              <PlanCard key={p.id} plan={p} onCta={openLead} />
            ))}
          </div>

          <div className="mt-14 pt-8 border-t border-rule flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-stone-deep leading-relaxed max-w-2xl">
              Todos os planos incluem <em className="serif-em text-ink">implantação acompanhada</em>, migração de dados e treinamento da
              equipe. Setup fee único conforme o porte da escola.
            </p>
            <button onClick={() => openLead('demo')} className="btn btn-outline btn-md whitespace-nowrap">
              Ver detalhes <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
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
            A gente acredita em plataformas únicas, regras explícitas, e silêncio bem desenhado.
            Cada decisão de produto passa por essas três peneiras.
          </p>
        </section>

        {/* ============ CONFIANÇA / RULES ============ */}
        <section className="py-32 border-b border-ink">
          <div className="eyebrow eyebrow-iris mb-12">— Confiabilidade</div>
          <h2 className="display-h2 max-w-3xl mb-16">
            Construído com a <em className="display-em">disciplina</em> de uma plataforma B2B séria.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-ink">
            {[
              {
                num: '01',
                title: 'Multi-tenant real',
                body: 'Row-Level Security no Postgres. Sua escola não divide banco com ninguém. Isolamento garantido por chave do tenant em cada query.',
              },
              {
                num: '02',
                title: 'Auditoria total',
                body: 'Logins, mudanças críticas, acessos a documentos sensíveis — tudo registrado com ator, ação, alvo e timestamp.',
              },
              {
                num: '03',
                title: 'Implantação assistida',
                body: 'Migração de dados, treinamento e onboarding em fases. A gente entra junto até a escola estar 100% no ar.',
              },
            ].map((r, i) => (
              <div
                key={r.num}
                className={[
                  'p-10 border-b border-rule',
                  i < 2 ? 'md:border-r border-rule' : '',
                  'md:border-b-0',
                ].join(' ')}
              >
                <div className="font-display italic font-light leading-none mb-4 text-stone-deep" style={{ fontSize: 64, fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1', opacity: 0.4 }}>
                  {r.num}
                </div>
                <h3 className="font-display italic font-normal text-xl mb-3" style={{ letterSpacing: '-0.02em', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
                  {r.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-soft">{r.body}</p>
              </div>
            ))}
          </div>
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
                Agendar demonstração <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
              <Link to="/login" className="btn btn-outline-inverted btn-xl">
                Já sou cliente · entrar
              </Link>
            </div>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="py-24">
          <div className="font-display font-light text-ink leading-none mb-12" style={{ fontSize: 'clamp(96px, 18vw, 240px)', letterSpacing: '-0.06em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
            agente <em className="display-em">school</em>
            <span aria-hidden style={{ display: 'inline-block', width: '0.13em', height: '0.13em', borderRadius: '50%', background: '#6B4FFF', marginLeft: '0.1em', verticalAlign: '0.05em' }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-ink pt-8 font-mono text-[11px] uppercase tracking-[0.10em] text-stone-deep gap-y-6">
            <div>
              <strong className="serif-em block text-ink mb-1.5" style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', textTransform: 'none', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
                Plataforma
              </strong>
              <button onClick={() => openLead('demo')} className="hover:text-ink block">Demonstração</button>
              <a href="#planos" className="hover:text-ink block">Planos</a>
              <Link to="/login" className="hover:text-ink block">Entrar</Link>
            </div>
            <div>
              <strong className="serif-em block text-ink mb-1.5" style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', textTransform: 'none', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
                Casa-mãe
              </strong>
              <span>agente lab</span>
              <span className="block">verticais ·</span>
              <span className="block">school · finance · health</span>
            </div>
            <div>
              <strong className="serif-em block text-ink mb-1.5" style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', textTransform: 'none', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
                Versão
              </strong>
              <span>v1 · 2026</span>
              <span className="block text-iris">● live</span>
            </div>
            <div>
              <strong className="serif-em block text-ink mb-1.5" style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', textTransform: 'none', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
                © {new Date().getFullYear()}
              </strong>
              agente school<br />todos os direitos reservados
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
