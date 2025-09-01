// admin/js/api.js
const API = {
  // Defina a base no localStorage: localStorage.setItem('cfg_integrations', JSON.stringify({ n8n: 'https://seu-n8n.com/webhook' }))
  get base() {
    try {
      const cfg = JSON.parse(localStorage.getItem('cfg_integrations') || '{}');
      return cfg.n8n || '';
    } catch { return ''; }
  },
  async _fetch(path, opts = {}) {
    if (!this.base) throw new Error('API base URL não configurada. Defina cfg_integrations.n8n no localStorage.');
    const res = await fetch(`${this.base}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(opts.headers||{}) },
      ...opts
    });
    if (!res.ok) {
      const body = await res.text().catch(()=> '');
      throw new Error(`API ${res.status}: ${body}`);
    }
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
  },

  // Barbers
  listBarbers()                 { return this._fetch('/admin/barbers', { method:'GET' }); },
  getBarber(id)                 { return this._fetch(`/admin/barbers/${encodeURIComponent(id)}`, { method:'GET' }); },
  createBarber(doc)             { return this._fetch('/admin/barbers', { method:'POST', body: JSON.stringify(doc) }); },
  saveBarber(id, doc)           { return this._fetch(`/admin/barbers/${encodeURIComponent(id)}`, { method:'PUT', body: JSON.stringify(doc) }); },
  deleteBarber(id)              { return this._fetch(`/admin/barbers/${encodeURIComponent(id)}`, { method:'DELETE' }); },

  // Agenda / Booking
  getAgenda(id, date)           { return this._fetch(`/admin/barbers/${encodeURIComponent(id)}/agenda?date=${encodeURIComponent(date)}`, { method:'GET' }); },
  setBookingStatus(id, status)  { return this._fetch(`/admin/bookings/${encodeURIComponent(id)}/status`, { method:'POST', body: JSON.stringify({ status }) }); },

  // Notificação
  whatsapp(phone, message)      { return this._fetch(`/notify/whatsapp`, { method:'POST', body: JSON.stringify({ phone, message }) }); },
};

export default API;
