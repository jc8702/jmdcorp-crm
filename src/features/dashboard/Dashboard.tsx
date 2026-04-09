import React from 'react';
import Gauge from '../../components/charts/Gauge';
import StackedBarChart from '../../components/charts/StackedBarChart';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { useAppContext } from '../../context/AppContext';
import type { Billing } from '../../context/AppContext';

const Dashboard: React.FC = () => {
  const { billings, totalPeriodo, totalPedidosCarteira, yearlyEvolutionData, currentMeta, selectedPeriod, setSelectedPeriod } = useAppContext();
  const [recentPage, setRecentPage] = React.useState(1);
  const [drilldownModal, setDrilldownModal] = React.useState<{ open: boolean; title: string; clients: any[] }>({ open: false, title: '', clients: [] });
  const recentItemsPerPage = 5;

  const percentualMeta = currentMeta > 0 ? Math.min(Math.round((totalPeriodo / currentMeta) * 100), 100) : 0;

  // Pro-rata Meta Logic (Business Days)
  const getProRataMeta = React.useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    const getBusinessDaysInPeriod = (year: number, month: number) => {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      let count = 0;
      const cur = new Date(start);
      while (cur <= end) {
        if (cur.getDay() !== 0 && cur.getDay() !== 6) count++;
        cur.setDate(cur.getDate() + 1);
      }
      return count;
    };

    const getBusinessDaysPassed = (year: number, month: number) => {
      const start = new Date(year, month - 1, 1);
      const today = new Date();
      
      // If selected month is in the past
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return getBusinessDaysInPeriod(year, month);
      }
      // If selected month is in the future
      if (year > currentYear || (year === currentYear && month > currentMonth)) {
        return 0;
      }
      
      // Current month
      let count = 0;
      const cur = new Date(start);
      while (cur <= today && cur.getMonth() + 1 === month) {
        if (cur.getDay() !== 0 && cur.getDay() !== 6) count++;
        cur.setDate(cur.getDate() + 1);
      }
      return count;
    };

    let totalDays = 0;
    let passedDays = 0;

    if (selectedPeriod === 'Annual') {
      for (let m = 1; m <= 12; m++) {
        totalDays += getBusinessDaysInPeriod(currentYear, m);
        passedDays += getBusinessDaysPassed(currentYear, m);
      }
    } else {
      const [y, m] = selectedPeriod.split('-').map(Number);
      totalDays = getBusinessDaysInPeriod(y, m);
      passedDays = getBusinessDaysPassed(y, m);
    }

    const expectedPerc = totalDays > 0 ? Math.round((passedDays / totalDays) * 100) : 0;
    const expectedValue = currentMeta * (passedDays / totalDays);
    const gap = totalPeriodo - expectedValue;

    return { expectedPerc, expectedValue, gap };
  }, [selectedPeriod, currentMeta, totalPeriodo]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) {
      return dateStr;
    }
  };

  const faturedBillings = billings.filter(b => b.status === 'FATURADO');
  
  const periods = [
    { id: 'Annual', label: 'Visão Anual (2026)' },
    { id: '2026-01', label: 'Janeiro 2026' },
    { id: '2026-02', label: 'Fevereiro 2026' },
    { id: '2026-03', label: 'Março 2026' },
    { id: '2026-04', label: 'Abril 2026' },
    { id: '2026-05', label: 'Maio 2026' },
    { id: '2026-06', label: 'Junho 2026' },
    { id: '2026-07', label: 'Julho 2026' },
    { id: '2026-08', label: 'Agosto 2026' },
    { id: '2026-09', label: 'Setembro 2026' },
    { id: '2026-10', label: 'Outubro 2026' },
    { id: '2026-11', label: 'Novembro 2026' },
    { id: '2026-12', label: 'Dezembro 2026' },
  ];

  const activeClientsYear = React.useMemo(() => {
    const currentYear = new Date().getFullYear().toString();
    const yearly = faturedBillings.filter(b => b.data.startsWith(currentYear));
    const uniqueClients = Array.from(new Set(yearly.map(b => b.cliente)));
    return uniqueClients.map(name => {
        const value = yearly.filter(b => b.cliente === name).reduce((acc, curr) => acc + curr.valor, 0);
        return { name, value };
    }).sort((a, b) => b.value - a.value);
  }, [faturedBillings]);

  const activeClientsMonth = React.useMemo(() => {
    const period = selectedPeriod === 'Annual' 
      ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` 
      : selectedPeriod;
    const monthly = faturedBillings.filter(b => b.data.startsWith(period));
    const uniqueClients = Array.from(new Set(monthly.map(b => b.cliente)));
    return uniqueClients.map(name => {
        const value = monthly.filter(b => b.cliente === name).reduce((acc, curr) => acc + curr.valor, 0);
        return { name, value };
    }).sort((a, b) => b.value - a.value);
  }, [faturedBillings, selectedPeriod]);

  const currentPeriodBillings = selectedPeriod === 'Annual' 
    ? faturedBillings.filter(b => b.data.startsWith(new Date().getFullYear().toString()))
    : faturedBillings.filter(b => b.data.startsWith(selectedPeriod));

  const ticketMedioCliente = activeClientsMonth.length > 0 ? (totalPeriodo / activeClientsMonth.length) : 0;

  // Recent Billings Pagination
  const recentTotalPages = Math.max(1, Math.ceil(billings.length / recentItemsPerPage));
  const paginatedRecent = billings.slice((recentPage - 1) * recentItemsPerPage, recentPage * recentItemsPerPage);

  const headers = ['Nota Fiscal', 'Pedido', 'Cliente', 'Código ERP', 'Valor R$', 'Data'];

  const renderBillingRow = (b: Billing) => (
    <>
      <td style={{ padding: '1rem' }}>{b.nf}</td>
      <td style={{ padding: '1rem' }}>{b.pedido}</td>
      <td style={{ padding: '1rem' }}>{b.cliente}</td>
      <td style={{ padding: '1rem' }}>{b.erp}</td>
      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{formatCurrency(b.valor)}</td>
      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{formatDate(b.data)}</td>
    </>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Painel Geral de Vendas</h2>
          <p style={{ color: 'var(--text-muted)' }}>Métricas extraídas em tempo real do banco de dados.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>Filtrar Período:</label>
          <select 
            className="input" 
            style={{ width: '200px', background: 'var(--surface)', borderColor: 'var(--primary)' }}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            {periods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Meta do Período ({selectedPeriod === 'Annual' ? 'Ano' : 'Real'})
          </h3>
          <Gauge value={percentualMeta} label="Atingido" sublabel={`Objetivo: ${formatCurrency(currentMeta)}`} />
          
          <div style={{ marginTop: '1.5rem', width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Ideal para hoje (Andamento):</span>
              <span style={{ fontWeight: 'bold' }}>{getProRataMeta.expectedPerc}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 'bold' }}>
              <span>{formatCurrency(getProRataMeta.expectedValue)}</span>
              <span style={{ color: getProRataMeta.gap >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {getProRataMeta.gap >= 0 ? '↑ ' : '↓ '}
                {formatCurrency(Math.abs(getProRataMeta.gap))}
              </span>
            </div>
            
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Faturamento Real:</p>
              <p style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{formatCurrency(totalPeriodo)}</p>
            </div>
          </div>
        </div>

        <div className="card">
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem' }}>Faturamentos Recentes</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                 <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} disabled={recentPage === 1} onClick={() => setRecentPage(p => p - 1)}>←</button>
                 <span style={{ fontSize: '0.75rem', alignSelf: 'center' }}>{recentPage} / {recentTotalPages}</span>
                 <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} disabled={recentPage === recentTotalPages} onClick={() => setRecentPage(p => p + 1)}>→</button>
              </div>
           </div>
           <DataTable 
             headers={headers} 
             data={paginatedRecent} 
             renderRow={renderBillingRow} 
           />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div className="card glass">
           <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ticket Médio (Faturamento / NFs)</p>
           <h4 style={{ fontSize: '1.25rem' }}>{currentPeriodBillings.length > 0 ? formatCurrency(totalPeriodo / currentPeriodBillings.length) : 'R$ 0,00'}</h4>
        </div>
        <div className="card glass" style={{ borderLeft: '4px solid var(--primary)' }}>
           <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ticket Médio (Faturamento / Clientes)</p>
           <h4 style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>{formatCurrency(ticketMedioCliente)}</h4>
        </div>
        <div className="card glass" style={{ borderLeft: '4px solid var(--warning)', cursor: 'pointer' }}>
           <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pedidos em Carteira</p>
           <h4 style={{ fontSize: '1.25rem', color: 'var(--warning)' }}>{formatCurrency(totalPedidosCarteira)}</h4>
        </div>
        <div 
          className="card glass" 
          style={{ borderLeft: '4px solid var(--primary)', cursor: 'pointer', transition: 'transform 0.2s' }}
          onClick={() => setDrilldownModal({ open: true, title: 'Clientes Ativos no Período', clients: activeClientsMonth })}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
           <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Clientes Ativos (Mês) 🔍</p>
           <h4 style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>{activeClientsMonth.length}</h4>
        </div>
        <div 
          className="card glass" 
          style={{ borderLeft: '4px solid var(--success)', cursor: 'pointer', transition: 'transform 0.2s' }}
          onClick={() => setDrilldownModal({ open: true, title: 'Clientes Ativos no Ano', clients: activeClientsYear })}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
           <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Clientes Ativos (Ano) 🔍</p>
           <h4 style={{ fontSize: '1.25rem', color: 'var(--success)' }}>{activeClientsYear.length}</h4>
        </div>
        <div className="card glass">
           <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total de Notas Fiscais</p>
           <h4 style={{ fontSize: '1.25rem' }}>{currentPeriodBillings.length}</h4>
        </div>
      </div>

      <div>
         <StackedBarChart 
            data={yearlyEvolutionData} 
            title="Evolução Mensal (Meta vs Faturado vs Carteira)" 
         />
      </div>

      <Modal 
        isOpen={drilldownModal.open} 
        onClose={() => setDrilldownModal(prev => ({ ...prev, open: false }))}
        title={drilldownModal.title}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <DataTable 
                headers={['Cliente', 'Total Faturado']}
                data={drilldownModal.clients}
                renderRow={(c) => (
                    <>
                        <td style={{ padding: '1rem' }}>{c.name}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{formatCurrency(c.value)}</td>
                    </>
                )}
            />
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;


