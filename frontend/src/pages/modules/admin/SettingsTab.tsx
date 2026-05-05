export default function SettingsTab() {
  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">Configurações do Sistema</h2>
        <div className="card p-6 space-y-6">
          <div>
            <label className="label">Nome da Escola</label>
            <input type="text" className="input" defaultValue="School Lab" />
          </div>
          <div>
            <label className="label">Idioma Padrão</label>
            <select className="input">
              <option value="pt">Português</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="label">Formato de Data</label>
            <select className="input">
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <button className="btn btn-primary btn-md">Salvar Configurações</button>
        </div>
      </div>
    </div>
  );
}
