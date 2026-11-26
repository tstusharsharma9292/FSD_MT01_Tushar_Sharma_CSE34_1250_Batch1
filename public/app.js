const API_BASE = '/api/students';

const tableBody = document.getElementById('studentTableBody');
const totalCountEl = document.getElementById('totalCount');
const showingCountEl = document.getElementById('showingCount');
const branchCountEl = document.getElementById('branchCount');
const lastStatusEl = document.getElementById('lastStatus');
const branchChipsEl = document.getElementById('branchChips');

const filterForm = document.getElementById('filterForm');
const branchInput = document.getElementById('branchInput');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const lookupForm = document.getElementById('lookupForm');
const idInput = document.getElementById('idInput');

const modal = document.getElementById('studentModal');
const modalTitle = document.getElementById('modalTitle');
const modalBackdrop = document.getElementById('modalBackdrop');
const openAddBtn = document.getElementById('openAddBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const studentForm = document.getElementById('studentForm');
const editStudentId = document.getElementById('editStudentId');
const formError = document.getElementById('formError');

let allStudents = [];
let activeBranch = '';

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function setLastStatus(status, ok = true) {
  lastStatusEl.textContent = status;
  lastStatusEl.style.color = ok ? 'var(--success)' : 'var(--danger)';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function renderChips(students) {
  const branches = [...new Set(students.map((s) => s.branch))].sort();
  branchCountEl.textContent = branches.length;

  branchChipsEl.innerHTML = '';
  const allChip = document.createElement('button');
  allChip.type = 'button';
  allChip.className = `chip ${activeBranch === '' ? 'active' : ''}`;
  allChip.textContent = 'All';
  allChip.addEventListener('click', () => {
    branchInput.value = '';
    activeBranch = '';
    loadStudents();
  });
  branchChipsEl.appendChild(allChip);

  branches.forEach((branch) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `chip ${activeBranch.toLowerCase() === branch.toLowerCase() ? 'active' : ''}`;
    chip.textContent = branch;
    chip.addEventListener('click', () => {
      branchInput.value = branch;
      filterByBranch(branch);
    });
    branchChipsEl.appendChild(chip);
  });
}

function renderStudents(list) {
  showingCountEl.textContent = list.length;

  if (!list.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">No matching student records found.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = list
    .map(
      (student) => `
      <tr>
        <td><strong>#${student.id}</strong></td>
        <td><code>${escapeHtml(student.rollNumber)}</code></td>
        <td>${escapeHtml(student.name)}</td>
        <td><span class="branch-badge">${escapeHtml(student.branch)}</span></td>
        <td>Sem ${student.semester}</td>
        <td>${escapeHtml(student.email)}</td>
        <td class="actions-col">
          <div class="actions-cell">
            <button type="button" class="btn btn-secondary btn-sm" onclick="openEditModal(${student.id})">Edit</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteStudent(${student.id})">Delete</button>
          </div>
        </td>
      </tr>
    `
    )
    .join('');
}

async function loadStudents() {
  try {
    const res = await fetch(API_BASE);
    const data = await res.json();
    setLastStatus(`${res.status} OK`, res.ok);
    allStudents = data;
    totalCountEl.textContent = allStudents.length;
    renderChips(allStudents);
    renderStudents(allStudents);
  } catch (err) {
    setLastStatus('ERR', false);
    showToast('Failed to load students', 'error');
  }
}

async function filterByBranch(branch) {
  activeBranch = branch.trim();
  if (!activeBranch) {
    return loadStudents();
  }

  try {
    const res = await fetch(`${API_BASE}/filter?branch=${encodeURIComponent(activeBranch)}`);
    const data = await res.json();
    setLastStatus(`${res.status} ${res.ok ? 'OK' : 'ERR'}`, res.ok);
    if (!res.ok) {
      showToast(data.error || 'Filter failed', 'error');
      return;
    }
    renderChips(allStudents);
    renderStudents(data);
  } catch (err) {
    showToast('Failed to filter students', 'error');
  }
}

async function lookupById(id) {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`);
    const data = await res.json();
    setLastStatus(`${res.status} ${res.ok ? 'OK' : 'NOT FOUND'}`, res.ok);
    if (!res.ok) {
      showToast(data.error || `Student #${id} not found`, 'error');
      renderStudents([]);
      return;
    }
    renderStudents([data]);
  } catch (err) {
    showToast('Lookup failed', 'error');
  }
}

function openModal(mode, student = null) {
  formError.classList.add('hidden');
  formError.textContent = '';

  if (mode === 'edit' && student) {
    modalTitle.textContent = `Edit Student #${student.id}`;
    editStudentId.value = student.id;
    document.getElementById('rollNumber').value = student.rollNumber;
    document.getElementById('name').value = student.name;
    document.getElementById('branch').value = student.branch;
    document.getElementById('semester').value = student.semester;
    document.getElementById('email').value = student.email;
  } else {
    modalTitle.textContent = 'Add Student';
    editStudentId.value = '';
    studentForm.reset();
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
}

window.openEditModal = function (id) {
  const student = allStudents.find((s) => s.id === id);
  if (student) openModal('edit', student);
};

window.deleteStudent = async function (id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    setLastStatus(`${res.status} ${res.ok ? 'OK' : 'ERR'}`, res.ok);
    if (!res.ok) {
      showToast(data.error || 'Delete failed', 'error');
      return;
    }
    showToast(`Deleted student #${id}`);
    activeBranch ? filterByBranch(activeBranch) : loadStudents();
    if (activeBranch) {
      // Refresh total count
      const allRes = await fetch(API_BASE);
      allStudents = await allRes.json();
      totalCountEl.textContent = allStudents.length;
      renderChips(allStudents);
    }
  } catch (err) {
    showToast('Failed to delete student', 'error');
  }
};

studentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.classList.add('hidden');

  const id = editStudentId.value;
  const payload = {
    rollNumber: document.getElementById('rollNumber').value.trim(),
    name: document.getElementById('name').value.trim(),
    branch: document.getElementById('branch').value.trim(),
    semester: Number(document.getElementById('semester').value),
    email: document.getElementById('email').value.trim()
  };

  const url = id ? `${API_BASE}/${id}` : API_BASE;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setLastStatus(`${res.status} ${res.ok ? (id ? 'OK' : 'CREATED') : 'BAD REQ'}`, res.ok);

    if (!res.ok) {
      const msg = data.details ? data.details.join(' • ') : data.error || 'Request failed';
      formError.textContent = msg;
      formError.classList.remove('hidden');
      return;
    }

    closeModal();
    showToast(id ? `Updated student #${id}` : `Added ${data.name} (#${data.id})`);
    activeBranch = '';
    branchInput.value = '';
    await loadStudents();
  } catch (err) {
    formError.textContent = 'Network error while saving student';
    formError.classList.remove('hidden');
  }
});

filterForm.addEventListener('submit', (e) => {
  e.preventDefault();
  filterByBranch(branchInput.value);
});

resetFilterBtn.addEventListener('click', () => {
  branchInput.value = '';
  idInput.value = '';
  activeBranch = '';
  loadStudents();
});

lookupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const val = idInput.value.trim();
  if (!val) return loadStudents();
  lookupById(val);
});

openAddBtn.addEventListener('click', () => openModal('add'));
closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);

loadStudents();
