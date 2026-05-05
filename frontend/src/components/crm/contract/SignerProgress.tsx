import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { ContractSigner, ContractSignerRole } from '@/types/contract';

interface SignerProgressProps {
  signers: ContractSigner[];
}

const roleConfig: Record<ContractSignerRole, { label: string; color: string }> = {
  PARENT: { label: 'Responsável', color: 'bg-blue-100 text-blue-800' },
  GUARDIAN: { label: 'Tutor', color: 'bg-purple-100 text-purple-800' },
  SCHOOL_REPRESENTATIVE: { label: 'Repr. Escola', color: 'bg-green-100 text-green-800' },
  WITNESS: { label: 'Testemunha', color: 'bg-neutral-100 text-neutral-800' },
};

export function SignerProgress({ signers }: SignerProgressProps) {
  const signedCount = signers.filter((s) => s.hasSigned).length;
  const total = signers.length;
  const percentage = total > 0 ? Math.round((signedCount / total) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
          <span>Progresso de Assinatura</span>
          <span>
            {signedCount} de {total} assinado{total !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Signer list */}
      <ul className="space-y-2">
        {signers.map((signer) => {
          const role = roleConfig[signer.role];
          return (
            <li
              key={signer.id}
              className="flex items-center justify-between p-2 rounded-lg border border-neutral-200 bg-white"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-neutral-800">{signer.name}</span>
                <span className="text-xs text-neutral-500">{signer.email}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${role.color}`}>
                  {role.label}
                </span>

                {signer.hasSigned ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    {signer.signedAt && (
                      <span className="text-xs">
                        {new Date(signer.signedAt).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                ) : signer.refusedAt ? (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs">Recusado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-amber-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Pendente</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
