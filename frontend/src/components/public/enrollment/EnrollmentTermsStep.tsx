import type { EnrollmentTermsStepProps } from './types';

export function EnrollmentTermsStep({
  register,
  watch,
  errors,
  language,
}: EnrollmentTermsStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-neutral-900">
        {language === 'pt' ? 'Termos e Condições' : 'Terms and Conditions'}
      </h2>

      <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-neutral-50">
        <h3 className="font-medium mb-4">
          {language === 'pt' ? 'Termo de Aceite' : 'Acceptance Terms'}
        </h3>
        <div className="text-sm text-neutral-700 space-y-4">
          <p>
            {language === 'pt'
              ? 'Ao enviar este formulário, declaro que todas as informações fornecidas são verdadeiras e completas.'
              : 'By submitting this form, I declare that all information provided is true and complete.'}
          </p>
          <p>
            {language === 'pt'
              ? 'Autorizo a escola a utilizar os dados fornecidos para fins de matrícula e comunicação relacionada ao processo educacional.'
              : 'I authorize the school to use the provided data for enrollment purposes and communication related to the educational process.'}
          </p>
          <p>
            {language === 'pt'
              ? 'Comprometo-me a manter os dados atualizados e informar a escola sobre qualquer alteração relevante.'
              : 'I commit to keeping the data updated and informing the school of any relevant changes.'}
          </p>
        </div>
      </div>

      <label className="flex items-start gap-3 p-4 border rounded-lg hover:bg-neutral-50 cursor-pointer">
        <input
          type="checkbox"
          {...register('termsAccepted', { required: true })}
          className="mt-1 rounded border-neutral-300 text-primary-600"
        />
        <span className="text-sm">
          {language === 'pt'
            ? 'Li e aceito os termos e condições acima. Declaro que todas as informações fornecidas são verdadeiras.'
            : 'I have read and accept the terms and conditions above. I declare that all information provided is true.'}
        </span>
      </label>
      {errors.termsAccepted && (
        <p className="text-sm text-red-500">
          {language === 'pt' ? 'Você deve aceitar os termos para continuar.' : 'You must accept the terms to continue.'}
        </p>
      )}
    </div>
  );
}
