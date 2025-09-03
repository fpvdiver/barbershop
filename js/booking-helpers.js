/* js/booking-helpers.js */
window.Booking = (() => {
  const read = (k) => localStorage.getItem(k) ?? sessionStorage.getItem(k);
  const write = (k, v, sess=false) =>
    (sess ? sessionStorage : localStorage).setItem(k, typeof v === 'string' ? v : JSON.stringify(v));

  const readJSON = (k, fallback) => { try { return JSON.parse(read(k) || ''); } catch { return fallback; } };

  return {
    // gravações
    setServices(ids)         { write('booking_services', ids); },
    setProfessional(id)      { write('booking_barber', id); write('booking.professional_id', id); },
    setDateTime(date, time)  { write('booking_datetime', {date, time}); write('booking.date', date); write('booking.time', time); },
    setProfile(p)            { write('booking_profile', p); },

    // leituras (robustas)
    getServices() { return readJSON('booking_services', []); },
    getProfessional() { return read('booking_barber') || read('booking.professional_id') || ''; },
    getDateTime()   { const o = readJSON('booking_datetime', {}); return { date: o.date || read('booking.date') || '', time: o.time || read('booking.time') || '' }; },
    getProfile()    { return readJSON('booking_profile', {}); },

    // debug visual opcional
    mountDebug(containerSelector = '.wrap') {
      const services = Booking.getServices();
      const prof = Booking.getProfessional();
      const dt = Booking.getDateTime();
      const div = document.createElement('div');
      div.style.cssText = 'margin:12px 0;padding:10px;border:1px dashed #ddd;border-radius:10px;font:12px/1.4 Inter,system-ui;color:#374151;background:#f9fafb';
      div.innerHTML = `<strong>Debug do funil</strong><br>services: ${JSON.stringify(services)}<br>professional_id: ${prof || '(vazio)'}<br>date: ${dt.date || '(vazio)'}<br>time: ${dt.time || '(vazio)'}`;
      document.querySelector(containerSelector)?.prepend(div);
    }
  };
})();
