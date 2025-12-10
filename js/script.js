// No automatic autoplay/resume. Music is controlled only by `player-ui.js`.
window.addEventListener('DOMContentLoaded', () => {
  try { localStorage.removeItem('autoplay'); } catch (e) {}

  // Prefill ticket name from stored intro values and wire summary updates
  try {
    const path = (window.location.pathname || '').toLowerCase();
    const first = localStorage.getItem('mf25FirstName') || '';
    const last = localStorage.getItem('mf25LastName') || '';
    const full = `${first} ${last}`.trim();

    if (path.endsWith('/index.html') || path.endsWith('/') || path === '') {
      const greet = document.getElementById('heroGreet');
      if (greet && first) {
        greet.textContent = `Welcome to LanternFest, ${first}!`;
      }
    }

    if (path.endsWith('/tickets.html') || path.endsWith('tickets.html')) {
      const nameInput = document.getElementById('name');
      const ticketInput = document.getElementById('tickets');
      const typeSelect = document.getElementById('type');
      const summaryType = document.getElementById('summaryType');
      const summaryCount = document.getElementById('summaryCount');
      const summaryPer = document.getElementById('summaryPer');
      const summaryFees = document.getElementById('summaryFees');
      const summaryTotal = document.getElementById('summaryTotal');
      const phoneInput = document.getElementById('phone');

      const priceMap = {
        'General Admission': 180,
        'VIP': 260,
        'Platinum': 320
      };
      const feesRate = 0.12;

      if (nameInput && full) {
        nameInput.value = full;
      }

      const updateSummary = () => {
        const type = typeSelect?.value || 'General Admission';
        const count = Math.max(1, parseInt(ticketInput?.value || '1', 10));
        const per = priceMap[type] || priceMap['General Admission'];
        const fees = Math.round(per * count * feesRate);
        const total = per * count + fees;
        if (summaryType) summaryType.textContent = type;
        if (summaryCount) summaryCount.textContent = count;
        if (summaryPer) summaryPer.textContent = `£${per}`;
        if (summaryFees) summaryFees.textContent = `£${fees}`;
        if (summaryTotal) summaryTotal.textContent = `£${total}`;
      };

      if (phoneInput) {
        phoneInput.addEventListener('input', () => {
          phoneInput.value = phoneInput.value.replace(/\D+/g, '');
        });
      }

      ticketInput?.addEventListener('input', updateSummary);
      typeSelect?.addEventListener('change', updateSummary);
      updateSummary();
    }
  } catch (e) {}
});
