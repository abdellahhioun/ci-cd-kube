const REPO = 'abdellahhioun/ci-cd-kube';
const API_URL = `https://api.github.com/repos/${REPO}/actions/runs`;
const BRANCHES_URL = `https://api.github.com/repos/${REPO}/branches`;

let allRuns = [];
let currentFilter = 'develop';
let activeRunId = null;
let modalPollInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setupEventListeners();
  await loadBranches();
  await fetchWorkflowRuns();
  
  // Auto-refresh runs list every 3 seconds seamlessly
  setInterval(fetchWorkflowRuns, 3000);
}

function setupEventListeners() {
  const branchSelect = document.getElementById('branchSelect');
  const refreshBtn = document.getElementById('refreshBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const jobModal = document.getElementById('jobModal');

  branchSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderDashboard();
  });

  refreshBtn.addEventListener('click', async () => {
    refreshBtn.disabled = true;
    await fetchWorkflowRuns();
    refreshBtn.disabled = false;
  });

  closeModalBtn.addEventListener('click', closeModal);
  jobModal.addEventListener('click', (e) => {
    if (e.target === jobModal) closeModal();
  });
}

async function loadBranches() {
  try {
    const res = await fetch(BRANCHES_URL);
    if (!res.ok) return;
    const branches = await res.json();
    const branchSelect = document.getElementById('branchSelect');
    
    const selectedVal = branchSelect.value;
    branchSelect.innerHTML = '<option value="all">🌐 Toutes les branches</option>';
    branches.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.name;
      opt.textContent = `${b.name === 'main' ? '⭐' : b.name === 'develop' ? '🚀' : '🌿'} ${b.name}`;
      if (b.name === selectedVal) opt.selected = true;
      branchSelect.appendChild(opt);
    });
  } catch (err) {
    console.warn('Could not fetch branches:', err);
  }
}

async function fetchWorkflowRuns() {
  try {
    const res = await fetch(`${API_URL}?per_page=20`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allRuns = data.workflow_runs || [];
    renderDashboard();
  } catch (err) {
    console.error('Error fetching workflow runs:', err);
  }
}

function renderDashboard() {
  const filteredRuns = currentFilter === 'all' 
    ? allRuns 
    : allRuns.filter(r => r.head_branch === currentFilter);

  updateMetrics(filteredRuns);
  updatePipelineNodes(filteredRuns.length > 0 ? filteredRuns[0] : null);
  updateRunsTable(filteredRuns);
}

function updateMetrics(runs) {
  const total = runs.length;
  document.getElementById('statTotalRuns').textContent = total;

  if (total === 0) {
    document.getElementById('statSuccessRate').textContent = '100%';
    document.getElementById('statAvgDuration').textContent = '0s';
    return;
  }

  const successRuns = runs.filter(r => r.conclusion === 'success').length;
  const successRate = Math.round((successRuns / total) * 100);
  document.getElementById('statSuccessRate').textContent = `${successRate}%`;

  const durations = runs
    .filter(r => r.updated_at && r.run_started_at)
    .map(r => (new Date(r.updated_at) - new Date(r.run_started_at)) / 1000);
  
  const avg = durations.length > 0 
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) 
    : 0;

  document.getElementById('statAvgDuration').textContent = `${avg}s`;
}

function updatePipelineNodes(latestRun) {
  const node1 = document.getElementById('nodeJob1');
  const node2 = document.getElementById('nodeJob2');
  const node3 = document.getElementById('nodeJob3');
  const node4 = document.getElementById('nodeJob4');

  const node1Icon = document.getElementById('node1Icon');
  const node2Icon = document.getElementById('node2Icon');
  const node3Icon = document.getElementById('node3Icon');
  const node4Icon = document.getElementById('node4Icon');

  if (!latestRun) {
    resetNodes();
    return;
  }

  const isSuccess = latestRun.conclusion === 'success';
  const isFailure = latestRun.conclusion === 'failure';
  const isInProgress = latestRun.status === 'in_progress' || latestRun.status === 'queued';

  [node1, node2, node3, node4].forEach(n => {
    n.classList.remove('success', 'failure', 'in_progress');
  });

  if (isSuccess) {
    [node1, node2, node3, node4].forEach(n => n.classList.add('success'));
    node1Icon.textContent = '✅';
    node2Icon.textContent = '✅';
    node3Icon.textContent = '✅';
    node4Icon.textContent = '✅';
  } else if (isFailure) {
    [node1, node2, node3, node4].forEach(n => n.classList.add('failure'));
    node1Icon.textContent = '❌';
    node2Icon.textContent = '❌';
    node3Icon.textContent = '❌';
    node4Icon.textContent = '❌';
  } else if (isInProgress) {
    node1.classList.add('in_progress');
    node2.classList.add('in_progress');
    node1Icon.textContent = '🔄';
    node2Icon.textContent = '🔄';
    node3Icon.textContent = '⏳';
    node4Icon.textContent = '⏳';
  }
}

function resetNodes() {
  ['nodeJob1', 'nodeJob2', 'nodeJob3', 'nodeJob4'].forEach(id => {
    document.getElementById(id).classList.remove('success', 'failure', 'in_progress');
  });
  document.getElementById('node1Icon').textContent = '⏳';
  document.getElementById('node2Icon').textContent = '⏳';
  document.getElementById('node3Icon').textContent = '⏳';
  document.getElementById('node4Icon').textContent = '⏳';
}

function updateRunsTable(runs) {
  const tbody = document.getElementById('runsTableBody');
  if (runs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="loading-cell">Aucune exécution trouvée pour cette branche.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = runs.map(r => {
    const statusClass = r.status === 'in_progress' || r.status === 'queued' ? 'in_progress' : r.conclusion;
    const statusLabel = r.conclusion === 'success' 
      ? '🟢 SUCCÈS' 
      : r.conclusion === 'failure' 
      ? '🔴 ÉCHEC' 
      : '🟡 EN COURS';
    
    const durationSec = r.updated_at && r.run_started_at 
      ? Math.round((new Date(r.updated_at) - new Date(r.run_started_at)) / 1000) 
      : 0;

    return `
      <tr onclick="openRunDetailsModal(${r.id})">
        <td>
          <span class="status-pill ${statusClass}">
            ${statusLabel}
          </span>
        </td>
        <td>
          <div class="commit-msg">${r.head_commit?.message || r.name}</div>
        </td>
        <td>
          <span class="branch-badge">${r.head_branch}</span>
        </td>
        <td>${r.triggering_actor?.login || r.actor?.login || 'GitHub'}</td>
        <td>${r.event}</td>
        <td>${durationSec}s</td>
        <td>
          <span class="action-link">
            Inspecter Jobs ➔
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

async function openRunDetailsModal(runId) {
  activeRunId = runId;
  const modal = document.getElementById('jobModal');
  modal.classList.remove('hidden');

  const run = allRuns.find(r => r.id === runId);
  if (run) {
    document.getElementById('modalTitle').textContent = `Workflow Run #${run.run_number}`;
    document.getElementById('modalRunSummary').innerHTML = `
      <div><strong>Branche :</strong> <span class="branch-badge">${run.head_branch}</span></div>
      <div><strong>Commit :</strong> ${run.head_commit?.message || 'Push commit'} (<code>${run.head_sha.substring(0, 7)}</code>)</div>
      <div><strong>Auteur :</strong> ${run.triggering_actor?.login || 'Developer'}</div>
    `;
    document.getElementById('modalGitHubLink').href = run.html_url;
  }

  await loadRunJobs(runId);

  if (modalPollInterval) clearInterval(modalPollInterval);
  modalPollInterval = setInterval(() => {
    if (activeRunId === runId) loadRunJobs(runId);
  }, 3000);
}

function closeModal() {
  document.getElementById('jobModal').classList.add('hidden');
  activeRunId = null;
  if (modalPollInterval) clearInterval(modalPollInterval);
}

async function loadRunJobs(runId) {
  const container = document.getElementById('modalJobsList');
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/actions/runs/${runId}/jobs`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const jobs = data.jobs || [];

    if (jobs.length === 0) {
      container.innerHTML = `<div class="loading-cell">Aucun job trouvé ou en attente d'initialisation...</div>`;
      return;
    }

    container.innerHTML = jobs.map(j => {
      const isCompleted = j.conclusion === 'success';
      const isFailed = j.conclusion === 'failure';
      const isInProgress = j.status === 'in_progress';
      const isQueued = j.status === 'queued';

      const statusClass = isCompleted ? 'completed' : isFailed ? 'failure' : isInProgress ? 'in_progress' : 'queued';
      const statusIcon = isCompleted ? '✅' : isFailed ? '❌' : isInProgress ? '🔄' : '⏳';
      const statusText = isCompleted 
        ? 'Terminé avec succès' 
        : isFailed 
        ? 'Échec (Inspectez les logs)' 
        : isInProgress 
        ? 'En cours d\'exécution...' 
        : 'En attente dans la file';

      const duration = j.completed_at && j.started_at 
        ? `${Math.round((new Date(j.completed_at) - new Date(j.started_at)) / 1000)}s` 
        : isInProgress 
        ? 'En cours...' 
        : '-';

      return `
        <div class="job-step-card ${statusClass}">
          <div class="job-info">
            <span class="job-step-icon">${statusIcon}</span>
            <div>
              <div class="job-name">${j.name}</div>
              <div class="job-subtext">${statusText}</div>
            </div>
          </div>
          <div class="job-time">${duration}</div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div class="loading-cell" style="color: var(--accent-rose)">⚠️ Erreur lors du chargement des jobs (${err.message})</div>`;
  }
}
