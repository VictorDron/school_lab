import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export type LeadIntent = 'pequeno' | 'medio' | 'grande' | 'sobmedida' | 'demo';

interface LeadForm {
  name: string;
  schoolName: string;
  email: string;
  phone: string;
  studentCount: string;
  notes?: string;
}

const INTENT_COPY: Record<LeadIntent, { eyebrow: string; title: string; italic: string; cta: string }> = {
  demo:      { eyebrow: '— Demonstração',   title: 'Vamos te mostrar a',  italic: 'plataforma',     cta: 'Agendar demonstração' },
  pequeno:   { eyebrow: '— Plano · 01',     title: 'O',                   italic: 'essencial',      cta: 'Quero começar' },
  medio:     { eyebrow: '— Plano · 02',     title: 'O plano que',         italic: 'cresce',         cta: 'Falar com especialista' },
  grande:    { eyebrow: '— Plano · 03',     title: 'IA, BI e',            italic: 'inteligência',   cta: 'Solicitar demonstração' },
  sobmedida: { eyebrow: '— Plano · 04',     title: 'Cada rede tem sua',   italic: 'realidade',      cta: 'Agendar conversa' },
};

interface Props {
  open: boolean;
  intent: LeadIntent;
  onClose: () => void;
}

export default function LeadCaptureModal({ open, intent, onClose }: Props) {
  const copy = INTENT_COPY[intent];
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadForm>();

  useEffect(() => {
    if (open) {
      setDone(false);
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  const onSubmit = async (data: LeadForm) => {
    setSubmitting(true);
    try {
      // TODO: POST /api/marketing/leads when backend endpoint lands.
      const lead = { ...data, intent, capturedAt: new Date().toISOString() };
      const queue = JSON.parse(localStorage.getItem('leads:queue') || '[]');
      queue.push(lead);
      localStorage.setItem('leads:queue', JSON.stringify(queue));

      await new Promise((r) => setTimeout(r, 600));
      setDone(true);
      toast.success('Recebemos. Vamos retornar em até 1 dia útil.');
    } catch {
      toast.error('Não foi possível enviar agora.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overlay"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="bg-paper border border-ink w-full max-w-[560px] pointer-events-auto relative my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto"
              style={{ boxShadow: '0 24px 56px -12px rgba(14, 13, 11, 0.25)' }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 inline-flex items-center justify-center text-stone-deep hover:bg-paper-deep hover:text-ink transition-colors"
                aria-label="Fechar"
                style={{ borderRadius: 4 }}
              >
                <X className="w-4 h-4" />
              </button>

              {!done ? (
                <div className="p-6 sm:p-10 pt-12 sm:pt-10">
                  <div className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-iris mb-4 sm:mb-5">
                    {copy.eyebrow}
                  </div>
                  <h3 className="font-display font-light leading-[1.05] sm:leading-none mb-3 text-ink break-words" style={{ fontSize: 'clamp(26px, 7vw, 36px)', letterSpacing: '-0.035em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
                    {copy.title}{' '}
                    <em className="display-em">{copy.italic}</em>
                    <span className="text-iris">.</span>
                  </h3>
                  <p className="serif-em text-stone-deep mb-6 sm:mb-8" style={{ fontSize: 'clamp(13px, 3.6vw, 15px)' }}>
                    — Preencha rapidinho. A gente retorna em até 1 dia útil.
                  </p>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">— Seu nome</label>
                        <input
                          {...register('name', { required: 'Obrigatório' })}
                          className={`input ${errors.name ? 'input-error' : ''}`}
                          placeholder="Maria Silva"
                        />
                      </div>
                      <div>
                        <label className="label">— Escola</label>
                        <input
                          {...register('schoolName', { required: 'Obrigatório' })}
                          className={`input ${errors.schoolName ? 'input-error' : ''}`}
                          placeholder="Escola São Francisco"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">— E-mail</label>
                        <input
                          type="email"
                          {...register('email', {
                            required: 'Obrigatório',
                            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Inválido' },
                          })}
                          className={`input ${errors.email ? 'input-error' : ''}`}
                          placeholder="voce@escola.com.br"
                        />
                      </div>
                      <div>
                        <label className="label">— Telefone</label>
                        <input
                          {...register('phone', { required: 'Obrigatório' })}
                          className={`input ${errors.phone ? 'input-error' : ''}`}
                          placeholder="(21) 9 9999-9999"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">— Quantos alunos</label>
                      <select
                        {...register('studentCount', { required: 'Obrigatório' })}
                        className={`input ${errors.studentCount ? 'input-error' : ''}`}
                        defaultValue=""
                      >
                        <option value="" disabled>Selecione…</option>
                        <option value="0-200">Até 200 alunos</option>
                        <option value="200-400">Entre 200 e 400 alunos</option>
                        <option value="400-600">Entre 400 e 600 alunos</option>
                        <option value="600+">Acima de 600 alunos · rede</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">— Algo que devemos saber <span className="text-stone normal-case tracking-normal">(opcional)</span></label>
                      <textarea
                        {...register('notes')}
                        className="input min-h-[88px] resize-y"
                        placeholder="Ex.: já usamos sistema X e queremos migrar; temos 3 unidades; etc."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary btn-lg w-full"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {copy.cta} <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
                        </>
                      )}
                    </button>
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone text-center">
                      Ao enviar, você concorda em ser contatado pela equipe agente school.
                    </p>
                  </form>
                </div>
              ) : (
                <div className="p-8 sm:p-12 pt-14 sm:pt-12 text-center">
                  <div className="inline-flex w-14 h-14 mb-6 items-center justify-center" style={{ background: 'rgba(27, 138, 78, 0.08)', color: '#1B8A4E', borderRadius: '100px', border: '1px solid rgba(27, 138, 78, 0.2)' }}>
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-iris mb-4">
                    — Recebido
                  </div>
                  <h3 className="font-display font-light leading-none mb-4 text-ink" style={{ fontSize: 'clamp(28px, 7vw, 36px)', letterSpacing: '-0.035em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
                    Até <em className="display-em">breve</em>.
                  </h3>
                  <p className="text-ink-soft mb-7 max-w-sm mx-auto leading-relaxed">
                    Nossa equipe retorna em até 1 dia útil pelo e-mail e telefone que você
                    informou.
                  </p>
                  <button onClick={onClose} className="btn btn-outline btn-md">
                    Fechar
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
