const syncTime = document.querySelector('#syncTime');
const acknowledgeBtn = document.querySelector('#acknowledgeBtn');
const alertList = document.querySelector('#alertList');
const alertBadge = document.querySelector('.alert-badge');
const chartProbability = document.querySelector('#chartProbability');
const drawer = document.querySelector('#detailDrawer');
const drawerBackdrop = document.querySelector('#drawerBackdrop');
const signalValue = document.querySelector('#signalValue');
const signalLabel = document.querySelector('#signalLabel');
const signalLine = document.querySelector('#signalLine');
const signalArea = document.querySelector('#signalArea');
const signalPoint = document.querySelector('#signalPoint');
const telemetryStatus = document.querySelector('#telemetryStatus');
const compressorValue = document.querySelector('#compressorValue');
const systemPanel = document.querySelector('.system-panel');
const systemState = document.querySelector('#systemState');
let activeSignal = 'temperature';
const twinPanel = document.querySelector('.twin-panel');
const twinAirflowValue = document.querySelector('#twinAirflowValue');
const twinVibrationValue = document.querySelector('#twinVibrationValue');
const airflowState = document.querySelector('#airflowState');
const vibrationState = document.querySelector('#vibrationState');
let calendarDate = new Date(2026, 8, 1);

function openDrawer(unit = 'AHU-04') {
  document.querySelector('#drawerTitle').textContent = unit;
  drawer.classList.add('open');
  drawerBackdrop.classList.add('open');
}

function closeDrawer() {
  drawer.classList.remove('open');
  drawerBackdrop.classList.remove('open');
}

document.querySelectorAll('.range-btn').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('.range-btn.active').classList.remove('active');
    button.classList.add('active');
    const values = { '24h': '6.8%', '7d': '7.4%', '30d': '8.1%' };
    chartProbability.textContent = values[button.dataset.range];
  });
});

acknowledgeBtn.addEventListener('click', () => {
  alertList.innerHTML = '<div class="empty-alerts"><span>✓</span><strong>All caught up</strong><small>No open alerts require attention.</small></div>';
  alertBadge.textContent = '0';
  acknowledgeBtn.textContent = 'Alerts acknowledged';
  acknowledgeBtn.disabled = true;
});

document.querySelectorAll('.nav-item').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelector('.nav-item.active').classList.remove('active');
    item.classList.add('active');
  });
});

document.querySelectorAll('.filter-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelector('.filter-chip.active').classList.remove('active');
    chip.classList.add('active');
  });
});

document.querySelector('#fleetSearch').addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();
  document.querySelectorAll('tbody tr').forEach((row) => {
    row.hidden = query && !row.textContent.toLowerCase().includes(query);
  });
});

document.querySelectorAll('.row-action').forEach((button) => button.addEventListener('click', () => openDrawer(button.dataset.unit)));
document.querySelector('#modelDetailsBtn').addEventListener('click', () => openDrawer('Model insights'));
document.querySelector('#openMaintenanceBtn').addEventListener('click', () => openDrawer('Maintenance queue'));
document.querySelector('#drawerClose').addEventListener('click', closeDrawer);
drawerBackdrop.addEventListener('click', closeDrawer);
document.querySelector('#scheduleBtn').addEventListener('click', (event) => {
  event.currentTarget.textContent = 'Maintenance scheduled ✓';
  event.currentTarget.disabled = true;
});
document.querySelector('#exportBtn').addEventListener('click', (event) => {
  event.currentTarget.textContent = 'Report ready ✓';
  setTimeout(() => { event.currentTarget.textContent = '⇩ Export report'; }, 1800);
});
document.querySelector('#pauseStreamBtn').addEventListener('click', (event) => {
  const paused = event.currentTarget.textContent.includes('Pause');
  event.currentTarget.textContent = paused ? '▶ Resume stream' : 'Ⅱ Pause stream';
  const liveLabel = document.querySelector('.live-label');
  if (liveLabel) liveLabel.innerHTML = paused ? '<i></i> Paused' : '<i></i> Streaming';
});

const signals = {
  temperature: { value: '22.8°C', label: 'Temperature · Network average', color: '#ef9b68', fill: 'url(#signalFill)', line: 'M0,108 C54,94 80,116 128,96 S203,90 250,102 S320,72 372,87 S435,92 480,70 S538,101 590,80 S650,92 710,62 S738,72 760,55', point: 55 },
  humidity: { value: '46%', label: 'Humidity · Network average', color: '#70aeda', fill: '#70aeda', line: 'M0,86 C52,76 92,88 138,81 S214,100 260,84 S324,89 372,76 S432,91 480,83 S542,66 590,78 S650,72 710,83 S738,67 760,72', point: 72 },
  airflow: { value: '1.82 m/s', label: 'Airflow · Network average', color: '#71bd8a', fill: '#71bd8a', line: 'M0,115 C54,102 80,119 128,93 S203,107 250,91 S320,97 372,81 S435,94 480,67 S538,85 590,72 S650,91 710,62 S738,72 760,56', point: 56 },
  vibration: { value: '0.38 g', label: 'Compressor vibration · AHU-04', color: '#8d7adb', fill: '#8d7adb', line: 'M0,112 C36,71 61,128 95,91 S144,124 181,86 S227,129 267,84 S315,120 352,79 S402,127 442,83 S484,123 527,77 S573,122 614,79 S664,114 706,67 S738,94 760,48', point: 48 }
};

document.querySelectorAll('.signal-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelector('.signal-tab.active').classList.remove('active');
    tab.classList.add('active');
    const signal = signals[tab.dataset.signal];
    activeSignal = tab.dataset.signal;
    signalValue.textContent = signal.value;
    signalLabel.textContent = signal.label;
    signalLine.setAttribute('d', signal.line);
    signalArea.setAttribute('d', `${signal.line} L760,160 L0,160Z`);
    signalLine.style.stroke = signal.color;
    signalPoint.style.stroke = signal.color;
    signalPoint.setAttribute('cy', signal.point);
    telemetryStatus.textContent = 'Live · just now';
  });
});

document.querySelector('#simulateAlert').addEventListener('click', (event) => {
  const alerting = !systemPanel.classList.contains('alerting');
  systemPanel.classList.toggle('alerting', alerting);
  systemState.className = `system-state ${alerting ? 'critical' : 'normal'}`;
  systemState.innerHTML = `<i></i> ${alerting ? 'Critical' : 'Normal'}`;
  compressorValue.textContent = alerting ? '0.82g' : '0.38g';
  event.currentTarget.textContent = alerting ? 'Resolve alert' : 'Simulate alert';
  twinPanel.classList.toggle('vibration-alert', alerting);
  twinVibrationValue.textContent = alerting ? '0.82g' : '0.38g';
  vibrationState.innerHTML = `<i></i> ${alerting ? 'Vibration critical' : 'Vibration normal'}`;
});

setInterval(() => {
  if (!systemPanel.classList.contains('alerting') && activeSignal === 'temperature') {
    const temperature = (22.6 + Math.random() * 0.5).toFixed(1);
    signalValue.textContent = `${temperature}°C`;
    telemetryStatus.textContent = `Live · ${Math.floor(Math.random() * 3) + 1} sec ago`;
  }
}, 3000);

let airflowLevel = 0;
document.querySelector('#simulateAirflow').addEventListener('click', (event) => {
  airflowLevel = (airflowLevel + 1) % 3;
  const states = [
    { className: '', value: '1.82 m/s', label: 'Airflow optimal', button: 'Simulate airflow drop' },
    { className: 'airflow-warning', value: '1.21 m/s', label: 'Airflow warning', button: 'Drop airflow further' },
    { className: 'airflow-critical', value: '0.64 m/s', label: 'Airflow critical', button: 'Restore airflow' }
  ];
  const state = states[airflowLevel];
  twinPanel.classList.remove('airflow-warning', 'airflow-critical');
  if (state.className) twinPanel.classList.add(state.className);
  twinAirflowValue.textContent = state.value;
  airflowState.innerHTML = `<i></i> ${state.label}`;
  event.currentTarget.textContent = state.button;
});

const calendarDays = document.querySelector('#calendarDays');
const calendarMonth = document.querySelector('#calendarMonth');
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  calendarMonth.textContent = `${monthNames[month]} ${year}`;
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousDays = new Date(year, month, 0).getDate();
  calendarDays.innerHTML = '';
  for (let index = 0; index < 42; index += 1) {
    const day = index - firstDay + 1;
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    let displayDay = day;
    if (day < 1) { displayDay = previousDays + day; cell.classList.add('muted'); }
    if (day > daysInMonth) { displayDay = day - daysInMonth; cell.classList.add('muted'); }
    cell.textContent = displayDay;
    if (year === 2026 && month === 8 && day === 18) cell.classList.add('today');
    if (day === 28 && month === 8) cell.classList.add('has-event');
    if (day === 6 && month === 8) cell.classList.add('has-event', 'warning-event');
    if (day === 15 && month === 8) cell.classList.add('has-event', 'scheduled-event');
    calendarDays.appendChild(cell);
  }
}

document.querySelector('#prevMonth').addEventListener('click', () => { calendarDate.setMonth(calendarDate.getMonth() - 1); renderCalendar(); });
document.querySelector('#nextMonth').addEventListener('click', () => { calendarDate.setMonth(calendarDate.getMonth() + 1); renderCalendar(); });
renderCalendar();

document.querySelectorAll('.schedule-task').forEach((button) => {
  button.addEventListener('click', () => {
    button.textContent = 'Scheduled ✓';
    button.classList.add('scheduled');
    button.disabled = true;
  });
});

function connectCalendar(provider) {
  const button = document.querySelector(provider === 'Google' ? '#googleCalendar' : '#outlookCalendar');
  button.innerHTML = `✓ <b>${provider} connected</b>`;
  button.classList.add('connected');
}

document.querySelector('#googleCalendar').addEventListener('click', () => connectCalendar('Google'));
document.querySelector('#outlookCalendar').addEventListener('click', () => connectCalendar('Outlook'));

let appliedRecommendations = 2;
let totalSavings = 0;
document.querySelectorAll('.apply-rec').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.classList.contains('applied')) return;
    button.classList.add('applied');
    button.textContent = 'Applied ✓';
    button.disabled = true;
    appliedRecommendations += 1;
    totalSavings += Number(button.dataset.saving);
    const score = Math.min(99, 78 + appliedRecommendations - 2);
    document.querySelector('#energyScore').textContent = score;
    document.querySelector('#appliedCount').textContent = `${appliedRecommendations} recommendations applied`;
    document.querySelector('#optimizedBar').style.width = `${Math.max(42, 64 - totalSavings / 2)}%`;
    document.querySelector('#reductionValue').textContent = `${(15.8 + totalSavings / 10).toFixed(1)}%`;
    document.querySelector('.energy-score-panel').classList.add('energy-panel-highlight');
    setTimeout(() => document.querySelector('.energy-score-panel').classList.remove('energy-panel-highlight'), 700);
  });
});

document.querySelector('#energyDetails').addEventListener('click', () => {
  document.querySelector('#energyDetails').innerHTML = 'Breakdown: cooling 52% · fan 31% · standby 17% <span>↗</span>';
});

const heatmapDetail = document.querySelector('#heatmapDetail');
document.querySelectorAll('.heat-cell').forEach((cell) => {
  cell.addEventListener('click', () => {
    document.querySelector('.heat-cell.selected')?.classList.remove('selected');
    cell.classList.add('selected');
    heatmapDetail.classList.add('active');
    const score = Number(cell.dataset.score);
    const severity = score >= 0.8 ? 'Critical anomaly' : score >= 0.5 ? 'Warning anomaly' : 'Normal variance';
    heatmapDetail.innerHTML = `<span class="detail-pulse"></span><div><strong>${cell.dataset.zone} · ${severity}</strong><small>${cell.dataset.time} · Anomaly score ${cell.dataset.score} · ${score >= 0.8 ? 'Investigate compressor vibration' : 'Within monitored range'}</small></div><span class="detail-hint">Signal: ${document.querySelector('#heatmapSignal').value}</span>`;
  });
});

document.querySelector('#heatmapSignal').addEventListener('change', (event) => {
  const signal = event.target.value;
  document.querySelectorAll('.heat-cell').forEach((cell) => {
    cell.style.opacity = signal === 'all' || signal === 'vibration' || (signal === 'airflow' && Number(cell.dataset.score) > 0.35) ? '1' : '.42';
  });
});

function PropertyControls() {
  const [property, setProperty] = React.useState('all');
  const [refreshing, setRefreshing] = React.useState(false);

  function handlePropertyChange(event) {
    const selected = event.target.options[event.target.selectedIndex].text.split(' · ')[0];
    setProperty(event.target.value);
    document.querySelector('.heading-copy').textContent = selected === 'All properties'
      ? 'Here’s what’s happening across your HVAC network.'
      : `Monitoring ${selected} in real time.`;
  }

  function refreshData() {
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
      syncTime.textContent = 'just now';
      document.querySelector('.chart-note strong').textContent = 'Updated moments ago';
    }, 650);
  }

  return React.createElement(React.Fragment, null,
    React.createElement('select', {
      id: 'propertySelect',
      className: 'property-select',
      value: property,
      onChange: handlePropertyChange,
      'aria-label': 'Select property'
    },
    React.createElement('option', { value: 'all' }, 'All properties · 24 units'),
    React.createElement('option', { value: 'oak' }, 'Oak Street Office · 12 units'),
    React.createElement('option', { value: 'cedar' }, 'Cedar House · 8 units'),
    React.createElement('option', { value: 'north' }, 'Northstar Loft · 4 units')),
    React.createElement('button', {
      className: 'button primary',
      id: 'refreshBtn',
      onClick: refreshData,
      disabled: refreshing
    }, React.createElement('span', null, '↻'), refreshing ? ' Refreshing...' : ' Refresh data')
  );
}

ReactDOM.createRoot(document.querySelector('#react-heading-actions')).render(
  React.createElement(PropertyControls)
);
