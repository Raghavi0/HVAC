const syncTime = document.querySelector('#syncTime');
const workspaceTitle = document.querySelector('#workspaceTitle');
const workspaceDescription = document.querySelector('#workspaceDescription');
const workspaceRange = document.querySelector('#workspaceRange');
const liveToggle = document.querySelector('#liveToggle');
const workspaceExport = document.querySelector('#workspaceExport');
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
    const target = document.querySelector(`#${item.dataset.target}`);
    if (!target) return;
    document.querySelector('.breadcrumbs strong').textContent = item.dataset.label;
    const workspaceDetails = {
      Overview: 'Network-wide operational summary',
      Equipment: 'Live equipment telemetry and system pulse',
      'Sensor health': 'Sensor coverage, readings, and signal quality',
      Maintenance: 'Priority work orders and predicted failures',
      Properties: 'Portfolio performance across managed properties',
      Team: 'Risk drivers and model collaboration insights',
      Settings: 'Assistant, voice bridge, and workspace controls',
      'Building Map': 'Live geographic building locations and HVAC health'
    };
    workspaceTitle.textContent = item.dataset.label;
    workspaceDescription.textContent = workspaceDetails[item.dataset.label];
    const overviewSelected = item.dataset.target === 'page-heading';
    document.querySelectorAll('.content-wrap > section').forEach((section) => {
      section.classList.toggle('workspace-hidden', !overviewSelected && section.id !== item.dataset.target);
    });
    document.querySelector('.page-footer').classList.toggle('workspace-hidden', !overviewSelected);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.classList.add('workspace-focus');
    window.setTimeout(() => target.classList.remove('workspace-focus'), 900);
  });
});

workspaceRange.addEventListener('change', (event) => {
  const rangeLabels = { '24h': 'Last 24 hours', '7d': 'Last 7 days', '30d': 'Last 30 days' };
  document.querySelector('.chart-note strong').textContent = `${rangeLabels[event.target.value]} selected`;
  syncTime.textContent = 'just now';
});

liveToggle.addEventListener('click', () => {
  const live = liveToggle.classList.toggle('active');
  liveToggle.querySelector('span').textContent = live ? 'Live updates' : 'Updates paused';
  document.querySelector('.live-label')?.classList.toggle('paused', !live);
});

workspaceExport.addEventListener('click', () => {
  const rows = [
    ['Airwise workspace report', workspaceTitle.textContent],
    ['Time range', workspaceRange.options[workspaceRange.selectedIndex].text],
    ['Healthy units', '21 / 24'],
    ['Failure risk', '7.4%'],
    ['Open alerts', '3'],
    ['Energy saved', '18.6%']
  ];
  const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = `airwise-${workspaceTitle.textContent.toLowerCase().replaceAll(' ', '-')}-report.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  workspaceExport.innerHTML = '<span>✓</span> Exported';
  window.setTimeout(() => { workspaceExport.innerHTML = '<span>⇩</span> Export'; }, 1600);
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

function Assistant() {
  const [messages, setMessages] = React.useState([
    { role: 'assistant', text: 'Hi Jamie. Ask me about HVAC health, anomalies, or maintenance priorities.' }
  ]);
  const [query, setQuery] = React.useState('');
  const [listening, setListening] = React.useState(false);
  const [providers, setProviders] = React.useState({ Alexa: false, 'Google Home': false });

  function answerQuestion(rawQuery) {
    const question = rawQuery.trim();
    if (!question) return;
    const normalized = question.toLowerCase();
    let answer = 'I can check network health, vibration anomalies, airflow, and maintenance priorities.';
    if (normalized.includes('vibration') && (normalized.includes('anomal') || normalized.includes('last week'))) {
      answer = 'Last week’s vibration anomalies:\n• AHU-04 · Oak Street Office · 0.82 score at 10:42\n• AHU-04 · Oak Street Office · 0.78 score at 08:00\n• HVAC-02 · Cedar House · 0.61 score at 10:18\nAHU-04 is the priority for compressor inspection.';
    } else if (normalized.includes('health') || normalized.includes('healthy') || normalized.includes('hvac')) {
      answer = 'Your HVAC network is healthy overall: 21 of 24 units are healthy, failure risk is 7.4%, and there are 3 open alerts. AHU-04 needs attention because vibration is above baseline.';
    } else if (normalized.includes('maintenance') || normalized.includes('priority')) {
      answer = 'The top maintenance priority is AHU-04 at Oak Street Office. Inspect the compressor bearings today; its failure probability is 78%.';
    }
    setMessages((current) => [...current, { role: 'user', text: question }, { role: 'assistant', text: answer }]);
    setQuery('');
  }

  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages((current) => [...current, { role: 'assistant', text: 'Voice input is not supported in this browser. You can still type your question here.' }]);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => answerQuestion(event.results[0][0].transcript);
    recognition.start();
  }

  function toggleProvider(provider) {
    setProviders((current) => ({ ...current, [provider]: !current[provider] }));
  }

  return React.createElement('div', { className: 'assistant-shell' },
    React.createElement('div', { className: 'assistant-chat' },
      React.createElement('div', { className: 'assistant-messages', 'aria-live': 'polite' }, messages.map((message, index) =>
        React.createElement('div', { className: `assistant-message ${message.role}`, key: `${message.role}-${index}` },
          React.createElement('span', { className: 'assistant-avatar' }, message.role === 'user' ? 'JC' : '✦'),
          React.createElement('p', null, message.text)
        )
      )),
      React.createElement('div', { className: 'assistant-suggestions' },
        React.createElement('button', { className: 'assistant-suggestion', onClick: () => answerQuestion('Show last week’s vibration anomalies') }, 'Last week’s vibration anomalies'),
        React.createElement('button', { className: 'assistant-suggestion', onClick: () => answerQuestion('How is my HVAC health?') }, 'How is my HVAC health?')
      ),
      React.createElement('form', { className: 'assistant-composer', onSubmit: (event) => { event.preventDefault(); answerQuestion(query); } },
        React.createElement('input', { value: query, onChange: (event) => setQuery(event.target.value), placeholder: 'Ask about your HVAC network...', 'aria-label': 'Ask the Airwise assistant' }),
        React.createElement('button', { type: 'button', className: `assistant-mic ${listening ? 'listening' : ''}`, onClick: startVoice, 'aria-label': 'Ask by voice' }, listening ? '●' : '⌕'),
        React.createElement('button', { type: 'submit', className: 'assistant-send', disabled: !query.trim() }, 'Ask')
      )
    ),
    React.createElement('aside', { className: 'voice-bridge' },
      React.createElement('span', { className: 'section-kicker' }, 'VOICE BRIDGE'),
      React.createElement('h3', null, 'Hands-free HVAC checks'),
      React.createElement('p', null, 'Connect a provider to route “How’s my HVAC health?” to this assistant.'),
      ['Alexa', 'Google Home'].map((provider) => React.createElement('div', { className: 'voice-provider', key: provider },
        React.createElement('span', null, provider),
        React.createElement('button', { className: `voice-connect ${providers[provider] ? 'connected' : ''}`, onClick: () => toggleProvider(provider) }, providers[provider] ? 'Ready' : 'Connect')
      ))
    )
  );
}

ReactDOM.createRoot(document.querySelector('#assistant-root')).render(
  React.createElement(Assistant)
);

const commandPalette = document.querySelector('#commandPalette');
const commandBackdrop = document.querySelector('#commandBackdrop');
const commandSearch = document.querySelector('#commandSearch');
const commandList = document.querySelector('#commandList');
const commands = [
  { label: 'Go to Overview', detail: 'Network summary', target: 'page-heading' },
  { label: 'Open Equipment telemetry', detail: 'Live signals and system pulse', target: 'realtime-grid' },
  { label: 'Review Sensor health', detail: 'Live network readings', target: 'lower-grid' },
  { label: 'Open Maintenance queue', detail: 'Upcoming work and risk', target: 'maintenance-section' },
  { label: 'Ask the Airwise assistant', detail: 'Chat and voice queries', target: 'assistant-section' },
  { label: 'Refresh dashboard data', detail: 'Sync the latest telemetry', action: () => document.querySelector('#refreshBtn')?.click() },
  { label: 'Acknowledge all alerts', detail: 'Clear current notifications', action: () => document.querySelector('#acknowledgeBtn')?.click() }
];

function renderCommands(query = '') {
  const filtered = commands.filter((command) => `${command.label} ${command.detail}`.toLowerCase().includes(query.toLowerCase()));
  commandList.innerHTML = filtered.map((command, index) => `<button class="command-item" data-command-index="${commands.indexOf(command)}"><span class="command-icon">${command.target ? '↗' : 'ϟ'}</span><span><strong>${command.label}</strong><small>${command.detail}</small></span><kbd>${index === 0 ? '↵' : ''}</kbd></button>`).join('');
  commandList.querySelectorAll('.command-item').forEach((item) => item.addEventListener('click', () => {
    const command = commands[Number(item.dataset.commandIndex)];
    if (command.target) document.querySelector(`.nav-item[data-target="${command.target}"]`)?.click();
    if (command.action) command.action();
    closeCommands();
  }));
}

function openCommands() {
  commandPalette.classList.add('open');
  commandBackdrop.classList.add('open');
  commandSearch.value = '';
  renderCommands();
  window.setTimeout(() => commandSearch.focus(), 30);
}

function closeCommands() {
  commandPalette.classList.remove('open');
  commandBackdrop.classList.remove('open');
}

document.querySelector('#commandBtn').addEventListener('click', openCommands);
document.querySelector('#commandClose').addEventListener('click', closeCommands);
commandBackdrop.addEventListener('click', closeCommands);
commandSearch.addEventListener('input', (event) => renderCommands(event.target.value));
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openCommands(); }
  if (event.key === 'Escape') closeCommands();
});

const voiceControl = document.querySelector('#voiceControl');
const voiceBackdrop = document.querySelector('#voiceBackdrop');
const voiceInput = document.querySelector('#voiceCommandInput');
const voiceStatus = document.querySelector('#voiceStatus');
const voiceTranscript = document.querySelector('#voiceTranscript');
const voiceResult = document.querySelector('#voiceResult');
const voiceConfirmation = document.querySelector('#voiceConfirmation');
const voiceConfirmationText = document.querySelector('#voiceConfirmationText');
const voiceListenButton = document.querySelector('#voiceListenButton');
let pendingVoiceAction = null;

function openVoiceControl() {
  voiceControl.classList.add('open');
  voiceBackdrop.classList.add('open');
  voiceInput.focus();
}

function closeVoiceControl() {
  voiceControl.classList.remove('open');
  voiceBackdrop.classList.remove('open');
  voiceConfirmation.hidden = true;
  pendingVoiceAction = null;
}

function focusDashboardSection(selector) {
  const section = document.querySelector(selector);
  if (!section) return;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  section.classList.add('workspace-focus');
  window.setTimeout(() => section.classList.remove('workspace-focus'), 900);
}

function parseVoiceCommand(rawCommand) {
  const command = rawCommand.trim();
  const normalized = command.toLowerCase().replace(/[?!.,]/g, '');
  const setTemperature = normalized.match(/^set\s+(?:room\s+)?([a-z0-9 -]+?)\s+to\s+(\d+(?:\.\d+)?)\s*degrees?$/);
  if (setTemperature) return { type: 'set-temperature', room: setTemperature[1].trim(), temperature: setTemperature[2] };
  if (/(?:today|today's)\s+energy\s+consumption|energy\s+consumption/.test(normalized)) return { type: 'energy' };
  if (/which\s+room\s+is\s+hottest|hottest\s+room/.test(normalized)) return { type: 'hottest-room' };
  const unitStatus = normalized.match(/(?:show|check|get|what is)\s+(?:the\s+)?(?:hvac\s+)?unit\s*([a-z0-9-]+)\s+status/);
  if (unitStatus) return { type: 'unit-status', unit: unitStatus[1].toUpperCase() };
  return { type: 'unknown' };
}

function showVoiceResult(message) {
  voiceResult.textContent = message;
  voiceStatus.textContent = 'Command completed';
}

function runVoiceCommand(rawCommand) {
  const command = rawCommand.trim();
  if (!command) return;
  voiceInput.value = command;
  voiceTranscript.textContent = `“${command}”`;
  const action = parseVoiceCommand(command);
  voiceResult.textContent = '';
  voiceConfirmation.hidden = true;
  pendingVoiceAction = null;

  if (action.type === 'set-temperature') {
    pendingVoiceAction = action;
    voiceStatus.textContent = 'Confirmation required';
    voiceConfirmationText.textContent = `Set Room ${action.room.replace(/^room\s+/i, '')} to ${action.temperature}°C? This changes a live HVAC setpoint.`;
    voiceConfirmation.hidden = false;
    return;
  }
  if (action.type === 'energy') {
    focusDashboardSection('.energy-section');
    showVoiceResult('Today’s energy consumption is 64.2 kWh. The optimized estimate is 50.8 kWh.');
    return;
  }
  if (action.type === 'hottest-room') {
    focusDashboardSection('.lower-grid');
    showVoiceResult('Room 204 is currently hottest at 24.0°C.');
    return;
  }
  if (action.type === 'unit-status') {
    openDrawer(`HVAC Unit ${action.unit}`);
    showVoiceResult(`HVAC Unit ${action.unit} is online. Current status: normal, with live telemetry available.`);
    return;
  }
  voiceStatus.textContent = 'Command not recognized';
  showVoiceResult('I can show energy consumption, identify the hottest room, show a unit status, or set a room temperature after confirmation.');
}

document.querySelector('#voiceCommandBtn').addEventListener('click', openVoiceControl);
document.querySelector('#voiceControlClose').addEventListener('click', closeVoiceControl);
voiceBackdrop.addEventListener('click', closeVoiceControl);
document.querySelector('#voiceCommandForm').addEventListener('submit', (event) => {
  event.preventDefault();
  runVoiceCommand(voiceInput.value);
});
document.querySelector('#voiceCancelAction').addEventListener('click', () => {
  voiceConfirmation.hidden = true;
  pendingVoiceAction = null;
  voiceStatus.textContent = 'Action cancelled';
  voiceResult.textContent = 'No HVAC settings were changed.';
});
document.querySelector('#voiceConfirmAction').addEventListener('click', () => {
  if (!pendingVoiceAction) return;
  const { room, temperature } = pendingVoiceAction;
  voiceConfirmation.hidden = true;
  pendingVoiceAction = null;
  voiceStatus.textContent = 'Action confirmed';
  voiceResult.textContent = `Room ${room.replace(/^room\s+/i, '')} setpoint change confirmed at ${temperature}°C.`;
});
voiceListenButton.addEventListener('click', () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voiceStatus.textContent = 'Voice input unavailable';
    voiceTranscript.textContent = 'Type a command below to continue.';
    voiceInput.focus();
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.onstart = () => { voiceStatus.textContent = 'Listening…'; voiceListenButton.classList.add('listening'); };
  recognition.onend = () => voiceListenButton.classList.remove('listening');
  recognition.onerror = () => { voiceStatus.textContent = 'Could not hear a command'; voiceListenButton.classList.remove('listening'); };
  recognition.onresult = (event) => runVoiceCommand(event.results[0][0].transcript);
  recognition.start();
});
