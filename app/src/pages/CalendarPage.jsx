import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { eventsApi } from '../lib/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EVENT_COLORS = {
  deadline:   { bg: 'var(--red-bg)',    text: 'var(--red)',    label: 'Prazo' },
  meeting:    { bg: 'var(--blue-bg)',   text: 'var(--blue)',   label: 'Reunião' },
  submission: { bg: 'var(--green-bg)',  text: 'var(--green)',  label: 'Entrega' },
  other:      { bg: 'var(--yellow-bg)', text: 'var(--yellow)', label: 'Outro' },
};

export default function CalendarPage() {
  const { profile } = useAuth();
  const [current, setCurrent] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    eventsApi.getAll(profile?.id, profile?.role)
      .then(setEvents).catch(console.error);
  }, [profile]);

  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) });
  const firstDayOfWeek = (startOfMonth(current).getDay() + 6) % 7; // Mon=0

  const getEventsForDay = (day) => events.filter(e => isSameDay(new Date(e.date), day));
  const selectedEvents = selected ? getEventsForDay(selected) : [];

  const handleDelete = async (id) => {
    if (!confirm('Eliminar evento?')) return;
    try {
      await eventsApi.delete(id);
      setEvents(ev => ev.filter(e => e.id !== id));
      toast.success('Evento eliminado');
    } catch { toast.error('Erro ao eliminar'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendário</h1>
          <p className="page-sub">Prazos, reuniões e entregas</p>
        </div>
        {(profile?.role === 'professor' || profile?.role === 'admin') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Novo Evento
          </button>
        )}
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
        {/* Calendar grid */}
        <div className="card">
          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setCurrent(d => subMonths(d, 1))}><ChevronLeft size={18} /></button>
            <h2 style={{ fontWeight: 700, fontSize: 16 }}>
              {format(current, 'MMMM yyyy', { locale: pt })}
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setCurrent(d => addMonths(d, 1))}><ChevronRight size={18} /></button>
          </div>

          {/* Weekday labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
            {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array(firstDayOfWeek).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const evts = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selected && isSameDay(day, selected);
              return (
                <div key={day.toISOString()} onClick={() => setSelected(day)}
                  style={{
                    padding: '6px 4px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', minHeight: 44,
                    background: isSelected ? 'var(--accent-subtle)' : isToday ? 'var(--bg-elevated)' : 'transparent',
                    border: isToday ? '1px solid var(--accent)' : '1px solid transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'var(--bg-elevated)' : 'transparent'; }}
                >
                  <div style={{ textAlign: 'center', fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 2 }}>
                    {format(day, 'd')}
                  </div>
                  {evts.slice(0, 2).map(e => {
                    const c = EVENT_COLORS[e.type] || EVENT_COLORS.other;
                    return <div key={e.id} style={{ fontSize: 9, background: c.bg, color: c.text, borderRadius: 2, padding: '1px 3px', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>;
                  })}
                  {evts.length > 2 && <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>+{evts.length - 2}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day events */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
            {selected ? format(selected, "d 'de' MMMM", { locale: pt }) : 'Seleciona um dia'}
          </h3>
          {!selected && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Clica num dia para ver os eventos.</p>}
          {selected && selectedEvents.length === 0 && (
            <div className="empty-state" style={{ padding: 24 }}>
              <p className="text-muted" style={{ fontSize: 14 }}>Sem eventos neste dia</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedEvents.map(ev => {
              const c = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
              return (
                <div key={ev.id} style={{ background: c.bg, border: `1px solid ${c.text}33`, borderRadius: 'var(--radius)', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: c.text }}>{ev.title}</p>
                    <p style={{ fontSize: 11, color: c.text, opacity: .7, marginTop: 2 }}>{c.label}</p>
                  </div>
                  {(profile?.role === 'professor' || profile?.role === 'admin') && (
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(ev.id)} style={{ color: c.text }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Upcoming */}
          <div style={{ marginTop: 24 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
              Próximos Eventos
            </h4>
            {events.filter(e => new Date(e.date) >= new Date()).slice(0, 5).map(ev => {
              const c = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
              return (
                <div key={ev.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.text, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{ev.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{format(new Date(ev.date), 'd MMM yyyy', { locale: pt })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <NewEventModal
          profileId={profile?.id}
          onClose={() => setShowModal(false)}
          onCreated={(ev) => { setEvents(prev => [...prev, ev]); setShowModal(false); }}
        />
      )}
    </div>
  );
}

function NewEventModal({ profileId, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', date: format(new Date(), 'yyyy-MM-dd'), type: 'deadline' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ev = await eventsApi.create({ ...form, user_id: profileId });
      toast.success('Evento criado!');
      onCreated(ev);
    } catch { toast.error('Erro ao criar evento'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Novo Evento</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Título *</label>
            <input className="input" placeholder="Ex: Entrega do Relatório Final" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Data *</label>
            <input className="input" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Tipo</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="deadline">Prazo</option>
              <option value="meeting">Reunião</option>
              <option value="submission">Entrega</option>
              <option value="other">Outro</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'A criar...' : 'Criar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
