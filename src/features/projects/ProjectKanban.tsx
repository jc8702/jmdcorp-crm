import React, { useState, useEffect } from 'react';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import Modal from '../../components/common/Modal';
import { useAppContext } from '../../context/AppContext';

const ProjectKanban: React.FC = () => {
  const { projects, updateKanbanStatus, addKanbanItem, updateKanbanItem, removeKanbanItem } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    subtitle: '', 
    contactName: '', 
    contactRole: '', 
    email: '', 
    phone: '', 
    city: '', 
    state: '', 
    value: '', 
    temperature: '❄️ Frio',
    description: '',
    status: 'novo' 
  });

  const columns = [
    { id: 'novo', title: 'Novo' },
    { id: 'analise', title: 'Analise de Necessidade' },
    { id: 'proposta', title: 'Cliente Avaliando Proposta' },
    { id: 'negociacao', title: 'Negociação' },
    { id: 'assinatura', title: 'Aguardando Assinatura de contrato' },
    { id: 'ganho', title: 'Ganho' },
  ];

  // Busca cidades do IBGE ao trocar o estado
  useEffect(() => {
    if (!formData.state) {
      setCities([]);
      return;
    }

    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios`);
        const data = await response.json();
        setCities(data.map((m: any) => m.nome).sort((a: string, b: string) => a.localeCompare(b)));
      } catch (error) {
        console.error("Erro ao buscar cidades:", error);
        setCities([]);
      } finally {
        setIsLoadingCities(false);
      }
    };

    fetchCities();
  }, [formData.state]);

  const handleMove = (id: string, newStatus: string) => {
    updateKanbanStatus('project', id, newStatus);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = { ...formData, value: parseFloat(formData.value) || 0, type: 'project' as const };
    
    if (editingItem) {
      await updateKanbanItem(editingItem.id, dataToSave);
    } else {
      await addKanbanItem(dataToSave);
    }
    
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ 
      title: '', subtitle: '', contactName: '', contactRole: '', 
      email: '', phone: '', city: '', state: '', value: '', 
      temperature: '❄️ Frio', description: '', status: 'novo' 
    });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      subtitle: item.subtitle || '',
      contactName: item.contactName || '',
      contactRole: item.contactRole || '',
      email: item.email || '',
      phone: item.phone || '',
      city: item.city || '',
      state: item.state || '',
      value: item.value?.toString() || '',
      temperature: item.temperature || '❄️ Frio',
      description: item.description || '',
      status: item.status
    });
    setIsModalOpen(true);
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '0.75rem',
    color: 'white',
    fontSize: '0.95rem',
    width: '100%',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '0.4rem',
    display: 'block'
  };

  const customSelectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none',
    background: 'rgba(255,255,255,0.05) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 0.75rem center',
    cursor: 'pointer'
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Gestão de Projetos</h2>
          <p style={{ color: 'var(--text-muted)' }}>Mapeamento de implementações técnicas.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setFormData({ title: '', subtitle: '', contactName: '', contactRole: '', email: '', phone: '', city: '', state: '', value: '', temperature: '❄️ Frio', description: '', status: 'novo' }); setIsModalOpen(true); }}>+ Novo Projeto</button>
      </header>

      <KanbanBoard 
        items={projects} 
        columns={columns} 
        onMove={handleMove} 
        onEdit={handleEdit}
        onDelete={removeKanbanItem}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Oportunidade" : "Cadastrar Oportunidade"} width="700px">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '80vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          
          {/* Linha 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Nome do Projeto</label>
              <input 
                style={inputStyle} 
                placeholder="Ex: Projeto ABC Corp" 
                required 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })} 
              />
            </div>
            <div>
              <label style={labelStyle}>Cliente/Empresa (Novo ou Existente)</label>
              <input 
                style={inputStyle} 
                placeholder="Ex: ABC Corp" 
                required 
                value={formData.subtitle} 
                onChange={e => setFormData({ ...formData, subtitle: e.target.value })} 
              />
            </div>
          </div>

          {/* Linha 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Nome do Contato</label>
              <input 
                style={inputStyle} 
                placeholder="Ex: João Silva" 
                value={formData.contactName} 
                onChange={e => setFormData({ ...formData, contactName: e.target.value })} 
              />
            </div>
            <div>
              <label style={labelStyle}>Cargo do Contato</label>
              <input 
                style={inputStyle} 
                placeholder="Ex: Gerente de Projetos" 
                value={formData.contactRole} 
                onChange={e => setFormData({ ...formData, contactRole: e.target.value })} 
              />
            </div>
          </div>

          {/* Linha 3 */}
          <div>
            <label style={labelStyle}>E-mail</label>
            <input 
              type="email" 
              style={inputStyle} 
              placeholder="exemplo@email.com" 
              value={formData.email} 
              onChange={e => setFormData({ ...formData, email: e.target.value })} 
            />
          </div>

          {/* Linha 4 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input 
                style={inputStyle} 
                placeholder="(11) 99999-9999" 
                value={formData.phone} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
              />
            </div>
            <div>
              <label style={labelStyle}>Cidade</label>
              <select 
                style={customSelectStyle} 
                value={formData.city} 
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                disabled={!formData.state || isLoadingCities}
              >
                <option value="" disabled style={{ background: '#1a1a1a' }}>
                  {isLoadingCities ? 'Carregando...' : formData.state ? 'Selecione a cidade...' : 'Selecione o estado primeiro'}
                </option>
                {cities.map(city => (
                  <option key={city} value={city} style={{ background: '#1a1a1a' }}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Linha 5 */}
          <div>
            <label style={labelStyle}>Estado</label>
            <select 
              style={customSelectStyle} 
              value={formData.state} 
              onChange={e => setFormData({ ...formData, state: e.target.value })}
            >
              <option value="" disabled style={{ background: '#1a1a1a' }}>Selecione...</option>
              <option value="AC" style={{ background: '#1a1a1a' }}>Acre</option>
              <option value="AL" style={{ background: '#1a1a1a' }}>Alagoas</option>
              <option value="AP" style={{ background: '#1a1a1a' }}>Amapá</option>
              <option value="AM" style={{ background: '#1a1a1a' }}>Amazonas</option>
              <option value="BA" style={{ background: '#1a1a1a' }}>Bahia</option>
              <option value="CE" style={{ background: '#1a1a1a' }}>Ceará</option>
              <option value="DF" style={{ background: '#1a1a1a' }}>Distrito Federal</option>
              <option value="ES" style={{ background: '#1a1a1a' }}>Espírito Santo</option>
              <option value="GO" style={{ background: '#1a1a1a' }}>Goiás</option>
              <option value="MA" style={{ background: '#1a1a1a' }}>Maranhão</option>
              <option value="MT" style={{ background: '#1a1a1a' }}>Mato Grosso</option>
              <option value="MS" style={{ background: '#1a1a1a' }}>Mato Grosso do Sul</option>
              <option value="MG" style={{ background: '#1a1a1a' }}>Minas Gerais</option>
              <option value="PA" style={{ background: '#1a1a1a' }}>Pará</option>
              <option value="PB" style={{ background: '#1a1a1a' }}>Paraíba</option>
              <option value="PR" style={{ background: '#1a1a1a' }}>Paraná</option>
              <option value="PE" style={{ background: '#1a1a1a' }}>Pernambuco</option>
              <option value="PI" style={{ background: '#1a1a1a' }}>Piauí</option>
              <option value="RJ" style={{ background: '#1a1a1a' }}>Rio de Janeiro</option>
              <option value="RN" style={{ background: '#1a1a1a' }}>Rio Grande do Norte</option>
              <option value="RS" style={{ background: '#1a1a1a' }}>Rio Grande do Sul</option>
              <option value="RO" style={{ background: '#1a1a1a' }}>Rondônia</option>
              <option value="RR" style={{ background: '#1a1a1a' }}>Roraima</option>
              <option value="SC" style={{ background: '#1a1a1a' }}>Santa Catarina</option>
              <option value="SP" style={{ background: '#1a1a1a' }}>São Paulo</option>
              <option value="SE" style={{ background: '#1a1a1a' }}>Sergipe</option>
              <option value="TO" style={{ background: '#1a1a1a' }}>Tocantins</option>
            </select>
          </div>

          {/* Linha 6 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Valor do Projeto (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                style={inputStyle} 
                placeholder="0.00" 
                value={formData.value} 
                onChange={e => setFormData({ ...formData, value: e.target.value })} 
              />
            </div>
            <div>
              <label style={labelStyle}>Temperatura do Projeto</label>
              <select 
                style={customSelectStyle} 
                value={formData.temperature} 
                onChange={e => setFormData({ ...formData, temperature: e.target.value })}
              >
                <option value="❄️ Frio" style={{ background: '#1a1a1a' }}>❄️ Frio</option>
                <option value="☁️ Morno" style={{ background: '#1a1a1a' }}>☁️ Morno</option>
                <option value="🔥 Quente" style={{ background: '#1a1a1a' }}>🔥 Quente</option>
              </select>
            </div>
          </div>

          {/* Observações / Descrição */}
          <div>
            <label style={labelStyle}>Descrição / Notas</label>
            <textarea 
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} 
              placeholder="Detalhes adicionais sobre o projeto..." 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              type="submit" 
              className="btn" 
              style={{ background: '#0070f3', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              ✓ {editingItem ? 'Salvar Alterações' : 'Cadastrar Oportunidade'}
            </button>
            <button 
              type="button" 
              className="btn" 
              onClick={() => setIsModalOpen(false)}
              style={{ background: '#e0e0e0', color: '#1a1a1a', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectKanban;


