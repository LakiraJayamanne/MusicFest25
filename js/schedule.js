(function() {
  const data = {
    day1: [
      { artist: 'Travis Scott', start: '16:00', end: '17:30' },
      { artist: 'Destroy Lonely', start: '17:45', end: '19:15' },
      { artist: 'Ken Carson', start: '19:30', end: '21:00' },
      { artist: 'Playboi Carti', start: '21:15', end: '22:45' }
    ],
    day2: [
      { artist: 'Ye', start: '16:00', end: '17:30' },
      { artist: 'Lil Uzi Vert', start: '17:45', end: '19:15' },
      { artist: 'Don Toliver', start: '19:30', end: '21:00' },
      { artist: 'Yeat', start: '21:15', end: '22:45' }
    ]
  };

  const dayTabs = document.querySelectorAll('.pill-tab');
  const timelineTracks = document.getElementById('timelineTracks');
  const timelineHeader = document.getElementById('timelineHeader');
  const listContainer = document.getElementById('scheduleList');

  const parseTime = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  const formatRange = (s, e) => {
    const fmt = (t) => {
      const hour = Math.floor(t / 60);
      const min = t % 60;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hr12 = ((hour + 11) % 12) + 1;
      return `${hr12}:${min.toString().padStart(2, '0')} ${ampm}`;
    };
    return `${fmt(s)} - ${fmt(e)}`;
  };

  const DAY_START = parseTime('16:00');
  const DAY_END = parseTime('22:45');
  const DAY_SPAN = DAY_END - DAY_START;

  const buildTicks = () => {
    if (!timelineHeader) return [];
    timelineHeader.innerHTML = '';
    const ticks = [];
    for (let t = DAY_START; t <= DAY_END; t += 60) {
      ticks.push(t);
    }
    if (ticks[ticks.length - 1] !== DAY_END) {
      ticks.push(DAY_END);
    }
    ticks.forEach((t) => {
      const tick = document.createElement('div');
      tick.className = 'tick';
      tick.style.left = `${((t - DAY_START) / DAY_SPAN) * 100}%`;
      tick.textContent = formatRange(t, t).split(' - ')[0];
      timelineHeader.appendChild(tick);
    });
    return ticks;
  };

  const renderTimeline = (entries) => {
    if (!timelineTracks) return;
    timelineTracks.innerHTML = '';
    const ticks = buildTicks();

    // grid lines
    const gridWrap = document.createElement('div');
    gridWrap.className = 'timeline-grid-lines';
    ticks.forEach((t) => {
      const line = document.createElement('div');
      line.className = 'timeline-grid-line';
      line.style.left = `${((t - DAY_START) / DAY_SPAN) * 100}%`;
      gridWrap.appendChild(line);
    });
    timelineTracks.appendChild(gridWrap);

    // y-axis labels
    const yLabelWrap = document.createElement('div');
    yLabelWrap.className = 'timeline-y-labels';
    const stageLabel = document.createElement('div');
    stageLabel.textContent = 'Main Stage';
    stageLabel.style.top = '8px';
    yLabelWrap.appendChild(stageLabel);
    timelineTracks.appendChild(yLabelWrap);

    entries.forEach((slot, idx) => {
      const start = parseTime(slot.start);
      const end = parseTime(slot.end);
      const leftPct = ((start - DAY_START) / DAY_SPAN) * 100;
      const widthPct = ((end - start) / DAY_SPAN) * 100;
      const bar = document.createElement('div');
      bar.className = 'timeline-bar';
      bar.style.left = `${leftPct}%`;
      bar.style.width = `${widthPct}%`;
      bar.style.top = `${idx * 68}px`;
      bar.innerHTML = `
        <div class="timeline-bar__name">${slot.artist}</div>
        <div class="timeline-bar__time">${formatRange(start, end)}</div>
      `;
      timelineTracks.appendChild(bar);
    });
    timelineTracks.style.height = `${entries.length * 68}px`;
  };

  const renderList = (entries) => {
    if (!listContainer) return;
    listContainer.innerHTML = '';
    entries.forEach((slot) => {
      const row = document.createElement('div');
      row.className = 'schedule-row';
      const start = parseTime(slot.start);
      const end = parseTime(slot.end);
      row.innerHTML = `
        <div class="schedule-time">${formatRange(start, end)}</div>
        <div class="schedule-artist">${slot.artist}</div>
      `;
      listContainer.appendChild(row);
    });
  };

  const setDay = (dayKey) => {
    const entries = data[dayKey] || [];
    dayTabs.forEach(btn => {
      const isActive = btn.dataset.day === dayKey;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    renderTimeline(entries);
    renderList(entries);
  };

  dayTabs.forEach(btn => {
    btn.addEventListener('click', () => setDay(btn.dataset.day));
  });

  setDay('day1');
})();
