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
  if (filteredRuns.length > 0) {
    fetchAndUpdatePipelineNodes(filteredRuns[0]);
  } else {
    resetNodes();
  }
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

  const completedRuns = runs.filter(r => r.status === 'completed');
  const successRuns = completedRuns.filter(r => r.conclusion === 'success').length;
  const successRate = completedRuns.length > 0 ? Math.round((successRuns / completedRuns.length) * 100) : 100;
  document.getElementById('statSuccessRate').textContent = `${successRate}%`;

  const durations = runs
    .filter(r => r.updated_at && r.run_started_at)
    .map(r => (new Date(r.updated_at) - new Date(r.run_started_at)) / 1000);
  
  const avg = durations.length > 0 
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) 
    : 0;

  document.getElementById('statAvgDuration').textContent = `${avg}s`;
}

async function fetchAndUpdatePipelineNodes(latestRun) {
  if (!latestRun) {
    resetNodes();
    return;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/actions/runs/${latestRun.id}/jobs`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const jobs = data.jobs || [];

    const job1 = jobs.find(j => j.name.includes('Job 1') || j.name.includes('typecheck'));
    const job2 = jobs.find(j => j.name.includes('Job 2') || j.name.includes('test'));
    const job3 = jobs.find(j => j.name.includes('Job 3') || j.name.includes('build-and-push'));
    const job4 = jobs.find(j => j.name.includes('Job 4') || j.name.includes('notify'));

    applyNodeState('nodeJob1', 'node1Icon', job1);
    applyNodeState('nodeJob2', 'node2Icon', job2);
    applyNodeState('nodeJob3', 'node3Icon', job3);
    applyNodeState('nodeJob4', 'node4Icon', job4);

  } catch (err) {
    console.warn('Could not fetch jobs for latest run:', err);
  }
}

function applyNodeState(nodeId, iconId, job) {
  const node = document.getElementById(nodeId);
  const icon = document.getElementById(iconId);
  if (!node || !icon) return;

  node.classList.remove('success', 'failure', 'in_progress', 'queued');

  if (!job) {
    icon.textContent = '⏳';
    return;
  }

  if (job.status === 'completed') {
    if (job.conclusion === 'success') {
      node.classList.add('success');
      icon.textContent = '✅';
    } else if (job.conclusion === 'failure') {
      node.classList.add('failure');
      icon.textContent = '❌';
    } else {
      icon.textContent = '⚪';
    }
  } else if (job.status === 'in_progress') {
    node.classList.add('in_progress');
    icon.textContent = '🔄';
  } else {
    node.classList.add('queued');
    icon.textContent = '⏳';
  }
}

function resetNodes() {
  ['nodeJob1', 'nodeJob2', 'nodeJob3', 'nodeJob4'].forEach(id => {
    document.getElementById(id).classList.remove('success', 'failure', 'in_progress', 'queued');
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
    const isCompleted = r.status === 'completed';
    const isSuccess = isCompleted && r.conclusion === 'success';
    const isFailure = isCompleted && r.conclusion === 'failure';
    
    const statusClass = isSuccess ? 'success' : isFailure ? 'failure' : 'in_progress';
    const statusLabel = isSuccess 
      ? '🟢 SUCCÈS' 
      : isFailure 
      ? '🔴 ÉCHEC' 
      : '⚡ EN COURS';
    
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
      const isCompleted = j.status === 'completed';
      const isSuccess = isCompleted && j.conclusion === 'success';
      const isFailed = isCompleted && j.conclusion === 'failure';
      const isInProgress = j.status === 'in_progress';

      const statusClass = isSuccess ? 'completed' : isFailed ? 'failure' : isInProgress ? 'in_progress' : 'queued';
      const statusIcon = isSuccess ? '✅' : isFailed ? '❌' : isInProgress ? '🔄' : '⏳';
      const statusText = isSuccess 
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
