// ====================== LOGIN (FRONT-END) ======================

const LOGIN_USER = "agendamandacaru";
const LOGIN_PASS = "amor@100";

// hub.html está na raiz do public_html, e este sistema está em uma pasta
const HUB_URL = "../hub.html";

const loginContainer = document.getElementById("login-container");
const appContainer = document.getElementById("app");
const loginForm = document.getElementById("login-form");
const loginUsuarioInput = document.getElementById("login-usuario");
const loginSenhaInput = document.getElementById("login-senha");
const loginErroSpan = document.getElementById("login-erro");
const btnHubSidebar = document.getElementById("btn-hub-sidebar");

function mostrarApp() {
  if (loginContainer) loginContainer.style.display = "none";
  if (appContainer) appContainer.style.display = "flex";
}

function mostrarLogin() {
  if (appContainer) appContainer.style.display = "none";
  if (loginContainer) loginContainer.style.display = "flex";
}

function verificarSessaoLogin() {
  // sempre exige login ao entrar
  mostrarLogin();
  if (loginUsuarioInput) loginUsuarioInput.focus();
}

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const u = loginUsuarioInput.value.trim();
    const s = loginSenhaInput.value;

    if (u === LOGIN_USER && s === LOGIN_PASS) {
      loginErroSpan.textContent = "";
      mostrarApp();
      init(); // carrega o sistema depois do login
    } else {
      loginErroSpan.textContent = "Usuário ou senha inválidos.";
      loginSenhaInput.value = "";
      loginSenhaInput.focus();
    }
  });
}

if (btnHubSidebar) {
  btnHubSidebar.addEventListener("click", () => {
    window.location.href = HUB_URL;
  });
}

// ====================== ESTADO / HELPERS ======================

let salas = [];
let especialidades = [];
let medicos = [];
let agendaSlots = [];
let callEntries = [];

function pad2(n) {
  return n.toString().padStart(2, "0");
}

// ====================== API HELPERS ======================

async function api(action, method = "GET", body = null) {
  const options = { method };
  if (body) options.body = body;

  const resp = await fetch("api.php?action=" + encodeURIComponent(action), options);
  let data;
  try {
    data = await resp.json();
  } catch (e) {
    throw new Error("Erro na resposta do servidor (" + action + ").");
  }
  if (!data.success) {
    throw new Error(data.error || "Erro na API (" + action + ").");
  }
  return data;
}

// listas iniciais
async function apiListAll() {
  const [salasData, espData, medData, agendaData, callData] = await Promise.all([
    api("salas.list"),
    api("especialidades.list"),
    api("medicos.list"),
    api("agenda.list"),
    api("call.list"),
  ]);

  salas = salasData.salas || [];
  especialidades = espData.especialidades || [];
  medicos = medData.medicos || [];
  agendaSlots = agendaData.slots || [];
  callEntries = callData.entries || [];
}

// salvar/excluir entidades

async function apiSaveSala(id, nome) {
  const fd = new FormData();
  if (id) fd.append("id", id);
  fd.append("nome", nome);
  const data = await api("salas.save", "POST", fd);
  return data.sala;
}

async function apiDeleteSala(id) {
  const fd = new FormData();
  fd.append("id", id);
  await api("salas.delete", "POST", fd);
}

async function apiSaveEspecialidade(id, nome) {
  const fd = new FormData();
  if (id) fd.append("id", id);
  fd.append("nome", nome);
  const data = await api("especialidades.save", "POST", fd);
  return data.especialidade;
}

async function apiDeleteEspecialidade(id) {
  const fd = new FormData();
  fd.append("id", id);
  await api("especialidades.delete", "POST", fd);
}

async function apiSaveMedico(id, nome, especialidadeId, pacientesHora) {
  const fd = new FormData();
  if (id) fd.append("id", id);
  fd.append("nome", nome);
  if (especialidadeId) fd.append("especialidadeId", especialidadeId);
  fd.append("pacientesHora", pacientesHora);
  const data = await api("medicos.save", "POST", fd);
  return data.medico;
}

async function apiDeleteMedico(id) {
  const fd = new FormData();
  fd.append("id", id);
  await api("medicos.delete", "POST", fd);
}

async function apiSaveAgendaSlot(id, data, horaInicio, horaFim, salaId, medicoId, obs) {
  const fd = new FormData();
  if (id) fd.append("id", id);
  fd.append("data", data);
  fd.append("horaInicio", horaInicio);
  fd.append("horaFim", horaFim);
  fd.append("salaId", salaId);
  if (medicoId) fd.append("medicoId", medicoId);
  fd.append("obs", obs || "");
  const dataResp = await api("agenda.save", "POST", fd);
  return dataResp.slot;
}

async function apiDeleteAgendaSlot(id) {
  const fd = new FormData();
  fd.append("id", id);
  await api("agenda.delete", "POST", fd);
}

async function apiSaveCallEntry(id, data, profissionalId, disp, ag, conf, at) {
  const fd = new FormData();
  if (id) fd.append("id", id);
  fd.append("data", data);
  if (profissionalId) fd.append("profissionalId", profissionalId);
  fd.append("disponibilizados", disp);
  fd.append("agendados", ag);
  fd.append("confirmados", conf);
  fd.append("atendidos", at);
  const dataResp = await api("call.save", "POST", fd);
  return dataResp.entry;
}

async function apiDeleteCallEntry(id) {
  const fd = new FormData();
  fd.append("id", id);
  await api("call.delete", "POST", fd);
}

// ====================== NAV / VIEWS ======================

const menuItems = document.querySelectorAll(".menu-item");
const views = document.querySelectorAll(".view");
const viewTitle = document.getElementById("view-title");

menuItems.forEach((btn) => {
  const viewName = btn.dataset.view;
  if (!viewName) return; // ignora botão do hub

  btn.addEventListener("click", () => {
    menuItems.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    viewTitle.textContent =
      viewName === "agenda"
        ? "Agenda"
        : viewName === "cadastros"
        ? "Cadastros"
        : "Call Center";

    views.forEach((v) => v.classList.remove("view-active"));
    document.getElementById(`view-${viewName}`).classList.add("view-active");
  });
});

// ====================== HELPERS DE NOME ======================

function getEspecialidadeNome(id) {
  const esp = especialidades.find((e) => e.id === id);
  return esp ? esp.nome : "";
}

function getSalaNome(id) {
  const s = salas.find((x) => x.id === id);
  return s ? s.nome : "";
}

function getMedicoNome(id) {
  const m = medicos.find((x) => x.id === id);
  return m ? m.nome : "";
}

// ====================== CADASTROS - SALAS ======================

const formSala = document.getElementById("form-sala");
const salaIdInput = document.getElementById("sala-id");
const salaNomeInput = document.getElementById("sala-nome");
const tableSalasBody = document.querySelector("#table-salas tbody");

function renderSalas() {
  tableSalasBody.innerHTML = "";
  salas.forEach((sala) => {
    const tr = document.createElement("tr");

    const tdId = document.createElement("td");
    tdId.textContent = sala.id;

    const tdNome = document.createElement("td");
    tdNome.textContent = sala.nome;

    const tdAcoes = document.createElement("td");
    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.textContent = "Editar";
    btnEdit.addEventListener("click", () => {
      salaIdInput.value = sala.id;
      salaNomeInput.value = sala.nome;
      salaNomeInput.focus();
    });

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.textContent = "Excluir";
    btnDel.addEventListener("click", async () => {
      if (!confirm("Excluir sala?")) return;
      try {
        await apiDeleteSala(sala.id);
        salas = salas.filter((s) => s.id !== sala.id);
        renderSalas();
        renderSelectsGlobais();
        updateCallDisponibilizados();
        renderAgendaResumoMes();
        renderAgendaGrade();
      } catch (err) {
        alert(err.message || "Erro ao excluir sala.");
      }
    });

    tdAcoes.classList.add("table-actions");
    tdAcoes.appendChild(btnEdit);
    tdAcoes.appendChild(btnDel);

    tr.appendChild(tdId);
    tr.appendChild(tdNome);
    tr.appendChild(tdAcoes);

    tableSalasBody.appendChild(tr);
  });
}

if (formSala) {
  formSala.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = salaNomeInput.value.trim();
    if (!nome) return;

    const idEdicao = salaIdInput.value ? Number(salaIdInput.value) : null;

    try {
      const salaSalva = await apiSaveSala(idEdicao, nome);

      if (idEdicao) {
        const sala = salas.find((s) => s.id === idEdicao);
        if (sala) sala.nome = salaSalva.nome;
      } else {
        salas.push(salaSalva);
      }

      salaIdInput.value = "";
      salaNomeInput.value = "";
      renderSalas();
      renderSelectsGlobais();
      updateCallDisponibilizados();
      renderAgendaResumoMes();
      renderAgendaGrade();
    } catch (err) {
      alert(err.message || "Erro ao salvar sala.");
    }
  });
}

// ====================== CADASTROS - ESPECIALIDADES ======================

const formEsp = document.getElementById("form-especialidade");
const espIdInput = document.getElementById("especialidade-id");
const espNomeInput = document.getElementById("especialidade-nome");
const tableEspBody = document.querySelector("#table-especialidades tbody");

function renderEspecialidades() {
  tableEspBody.innerHTML = "";
  especialidades.forEach((esp) => {
    const tr = document.createElement("tr");

    const tdId = document.createElement("td");
    tdId.textContent = esp.id;

    const tdNome = document.createElement("td");
    tdNome.textContent = esp.nome;

    const tdAcoes = document.createElement("td");
    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.textContent = "Editar";
    btnEdit.addEventListener("click", () => {
      espIdInput.value = esp.id;
      espNomeInput.value = esp.nome;
      espNomeInput.focus();
    });

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.textContent = "Excluir";
    btnDel.addEventListener("click", async () => {
      if (!confirm("Excluir especialidade?")) return;
      try {
        await apiDeleteEspecialidade(esp.id);
        especialidades = especialidades.filter((e) => e.id !== esp.id);
        renderEspecialidades();
        renderSelectsGlobais();
      } catch (err) {
        alert(err.message || "Erro ao excluir especialidade.");
      }
    });

    tdAcoes.classList.add("table-actions");
    tdAcoes.appendChild(btnEdit);
    tdAcoes.appendChild(btnDel);

    tr.appendChild(tdId);
    tr.appendChild(tdNome);
    tr.appendChild(tdAcoes);

    tableEspBody.appendChild(tr);
  });
}

if (formEsp) {
  formEsp.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = espNomeInput.value.trim();
    if (!nome) return;

    const idEdicao = espIdInput.value ? Number(espIdInput.value) : null;

    try {
      const espSalva = await apiSaveEspecialidade(idEdicao, nome);

      if (idEdicao) {
        const esp = especialidades.find((s) => s.id === idEdicao);
        if (esp) esp.nome = espSalva.nome;
      } else {
        especialidades.push(espSalva);
      }

      espIdInput.value = "";
      espNomeInput.value = "";
      renderEspecialidades();
      renderSelectsGlobais();
    } catch (err) {
      alert(err.message || "Erro ao salvar especialidade.");
    }
  });
}

// ====================== CADASTROS - MÉDICOS ======================

const formMedico = document.getElementById("form-medico");
const medicoIdInput = document.getElementById("medico-id");
const medicoNomeInput = document.getElementById("medico-nome");
const medicoEspSelect = document.getElementById("medico-especialidade");
const medicoPacientesHoraInput = document.getElementById("medico-pacientes-hora");
const tableMedicosBody = document.querySelector("#table-medicos tbody");

function renderMedicos() {
  tableMedicosBody.innerHTML = "";
  medicos.forEach((med) => {
    const tr = document.createElement("tr");

    const tdId = document.createElement("td");
    tdId.textContent = med.id;

    const tdNome = document.createElement("td");
    tdNome.textContent = med.nome;

    const tdEsp = document.createElement("td");
    tdEsp.textContent = getEspecialidadeNome(med.especialidadeId || null);

    const tdPac = document.createElement("td");
    tdPac.textContent = med.pacientesHora || "";

    const tdAcoes = document.createElement("td");
    tdAcoes.classList.add("table-actions");

    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.textContent = "Editar";
    btnEdit.addEventListener("click", () => {
      medicoIdInput.value = med.id;
      medicoNomeInput.value = med.nome;
      medicoEspSelect.value = med.especialidadeId || "";
      medicoPacientesHoraInput.value = med.pacientesHora || 4;
      medicoNomeInput.scrollIntoView({ behavior: "smooth", block: "center" });
      medicoNomeInput.focus();
    });

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.textContent = "Excluir";
    btnDel.addEventListener("click", async () => {
      if (!confirm("Excluir médico/profissional?")) return;
      try {
        await apiDeleteMedico(med.id);
        medicos = medicos.filter((m) => m.id !== med.id);
        renderMedicos();
        renderSelectsGlobais();
        updateCallDisponibilizados();
        renderAgendaResumoMes();
      } catch (err) {
        alert(err.message || "Erro ao excluir médico.");
      }
    });

    tdAcoes.appendChild(btnEdit);
    tdAcoes.appendChild(btnDel);

    tr.appendChild(tdId);
    tr.appendChild(tdNome);
    tr.appendChild(tdEsp);
    tr.appendChild(tdPac);
    tr.appendChild(tdAcoes);

    tableMedicosBody.appendChild(tr);
  });
}

if (formMedico) {
  formMedico.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = medicoNomeInput.value.trim();
    if (!nome) return;

    const espId = medicoEspSelect.value ? Number(medicoEspSelect.value) : null;
    const pacientesHora = Number(medicoPacientesHoraInput.value || 0);
if (isNaN(pacientesHora) || pacientesHora < 0) {
  alert("Informe uma quantidade válida de pacientes por hora (0 ou mais).");
  return;
}


    const idEdicao = medicoIdInput.value ? Number(medicoIdInput.value) : null;

    try {
      const medSalvo = await apiSaveMedico(idEdicao, nome, espId, pacientesHora);

      if (idEdicao) {
        const med = medicos.find((m) => m.id === idEdicao);
        if (med) {
          med.nome = medSalvo.nome;
          med.especialidadeId = medSalvo.especialidadeId;
          med.pacientesHora = medSalvo.pacientesHora;
        }
      } else {
        medicos.push(medSalvo);
      }

      medicoIdInput.value = "";
      medicoNomeInput.value = "";
      medicoEspSelect.value = "";
      medicoPacientesHoraInput.value = 4;
      renderMedicos();
      renderSelectsGlobais();
      updateCallDisponibilizados();
      renderAgendaResumoMes();
    } catch (err) {
      alert(err.message || "Erro ao salvar médico.");
    }
  });
}

// ====================== SELECTS GLOBAIS ======================

const agendaSalaSelect = document.getElementById("agenda-sala");
const agendaMedicoSelect = document.getElementById("agenda-medico");
const slotSalaSelect = document.getElementById("slot-sala");
const slotMedicoSelect = document.getElementById("slot-medico");
const callProfSelect = document.getElementById("call-profissional");

function renderSelectsGlobais() {
  // Especialidades no cadastro médico
  medicoEspSelect.innerHTML = `<option value="">(sem)</option>`;
  especialidades.forEach((esp) => {
    const opt = document.createElement("option");
    opt.value = esp.id;
    opt.textContent = esp.nome;
    medicoEspSelect.appendChild(opt);
  });

  // Salas
  agendaSalaSelect.innerHTML = `<option value="">Todas</option>`;
  slotSalaSelect.innerHTML = "";
  salas.forEach((s) => {
    const opt1 = document.createElement("option");
    opt1.value = s.id;
    opt1.textContent = s.nome;
    agendaSalaSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = s.id;
    opt2.textContent = s.nome;
    slotSalaSelect.appendChild(opt2);
  });

  // Médicos
  agendaMedicoSelect.innerHTML = `<option value="">Todos</option>`;
  slotMedicoSelect.innerHTML = `<option value="">Sem vínculo</option>`;
  callProfSelect.innerHTML = `<option value="">Geral</option>`;

  medicos.forEach((m) => {
    const opt1 = document.createElement("option");
    opt1.value = m.id;
    opt1.textContent = m.nome;
    agendaMedicoSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = m.id;
    opt2.textContent = m.nome;
    slotMedicoSelect.appendChild(opt2);

    const opt3 = document.createElement("option");
    opt3.value = m.id;
    opt3.textContent = m.nome;
    callProfSelect.appendChild(opt3);
  });
}

// ====================== AGENDA ======================

const formFiltroAgenda = document.getElementById("form-filtro-agenda");
const agendaDataInput = document.getElementById("agenda-data");
const agendaMesInput = document.getElementById("agenda-mes");
const tableAgendaBody = document.querySelector("#table-agenda tbody");
const btnNovoSlot = document.getElementById("btn-novo-slot");

const agendaTabs = document.querySelectorAll(".agenda-tab");
const agendaSubviewLista = document.getElementById("agenda-subview-lista");
const agendaSubviewCalendario = document.getElementById("agenda-subview-calendario");
const agendaSubviewGrade = document.getElementById("agenda-subview-grade");
const agendaCalendarioGrid = document.getElementById("agenda-calendario-grid");
const tableAgendaGradeHead = document.querySelector("#table-agenda-grade thead tr");
const tableAgendaGradeBody = document.querySelector("#table-agenda-grade tbody");

// Modal
const modalAgendaBackdrop = document.getElementById("modal-agenda-backdrop");
const modalAgendaClose = document.getElementById("modal-agenda-close");
const modalAgendaTitle = document.getElementById("modal-agenda-title");
const btnCancelarSlot = document.getElementById("btn-cancelar-slot");
const formAgendaSlot = document.getElementById("form-agenda-slot");

const slotIdInput = document.getElementById("agenda-slot-id");
const slotDataInput = document.getElementById("slot-data");
const slotHoraInicioInput = document.getElementById("slot-hora-inicio");
const slotHoraFimInput = document.getElementById("slot-hora-fim");
const slotObsTextarea = document.getElementById("slot-obs");

const extraDatesContainer = document.getElementById("slot-extra-dates-container");
const btnAddExtraDate = document.getElementById("btn-add-extra-date");

function clearExtraDates() {
  if (extraDatesContainer) {
    extraDatesContainer.innerHTML = "";
  }
}

if (btnAddExtraDate && extraDatesContainer) {
  btnAddExtraDate.addEventListener("click", () => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("form-inline");

    const input = document.createElement("input");
    input.type = "date";
    input.classList.add("slot-extra-date");

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "Remover";
    removeBtn.addEventListener("click", () => wrapper.remove());

    wrapper.appendChild(input);
    wrapper.appendChild(removeBtn);
    extraDatesContainer.appendChild(wrapper);
  });
}


// Resumo
const resumoSalasTotal = document.getElementById("resumo-salas-total");
const resumoSalasOcupadas = document.getElementById("resumo-salas-ocupadas");
const resumoHorasPossiveis = document.getElementById("resumo-horas-possiveis");
const resumoHorasUsadas = document.getElementById("resumo-horas-usadas");
const resumoOcupacaoPercent = document.getElementById("resumo-ocupacao-percent");

function abrirModalAgenda(titulo = "Novo horário") {
  modalAgendaTitle.textContent = titulo;
  modalAgendaBackdrop.classList.add("active");
}

function fecharModalAgenda() {
  modalAgendaBackdrop.classList.remove("active");
}

modalAgendaClose.addEventListener("click", fecharModalAgenda);
btnCancelarSlot.addEventListener("click", fecharModalAgenda);

btnNovoSlot.addEventListener("click", () => {
  slotIdInput.value = "";
  slotDataInput.value = agendaDataInput.value || "";
  slotHoraInicioInput.value = "";
  slotHoraFimInput.value = "";
  slotSalaSelect.value = "";
  slotMedicoSelect.value = "";
  slotObsTextarea.value = "";
  clearExtraDates();
  abrirModalAgenda("Novo horário");
});


// Tabs da agenda
agendaTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    agendaTabs.forEach((t) => t.classList.remove("agenda-tab-active"));
    tab.classList.add("agenda-tab-active");

    const view = tab.dataset.agendaView;
    agendaSubviewLista.classList.remove("agenda-subview-active");
    agendaSubviewCalendario.classList.remove("agenda-subview-active");
    agendaSubviewGrade.classList.remove("agenda-subview-active");

    if (view === "lista") agendaSubviewLista.classList.add("agenda-subview-active");
    if (view === "calendario") agendaSubviewCalendario.classList.add("agenda-subview-active");
    if (view === "grade") agendaSubviewGrade.classList.add("agenda-subview-active");
  });
});

// LISTA
function renderAgendaLista() {
  const dataFiltro = agendaDataInput.value;
  const salaFiltro = agendaSalaSelect.value ? Number(agendaSalaSelect.value) : null;
  const medicoFiltro = agendaMedicoSelect.value ? Number(agendaMedicoSelect.value) : null;

  tableAgendaBody.innerHTML = "";

  const slotsFiltrados = agendaSlots.filter((slot) => {
    if (dataFiltro && slot.data !== dataFiltro) return false;
    if (salaFiltro && slot.salaId !== salaFiltro) return false;
    if (medicoFiltro && slot.medicoId !== medicoFiltro) return false;
    return true;
  });

  slotsFiltrados.sort((a, b) => {
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    return a.horaInicio.localeCompare(b.horaInicio);
  });

  slotsFiltrados.forEach((slot) => {
    const tr = document.createElement("tr");

    const tdData = document.createElement("td");
    tdData.textContent = slot.data.split("-").reverse().join("/");

    const tdHora = document.createElement("td");
    tdHora.textContent = `${slot.horaInicio} - ${slot.horaFim}`;

    const tdSala = document.createElement("td");
    tdSala.textContent = getSalaNome(slot.salaId);

    const tdMedico = document.createElement("td");
    tdMedico.textContent = slot.medicoId ? getMedicoNome(slot.medicoId) : "";

    const tdObs = document.createElement("td");
    tdObs.textContent = slot.obs || "";

    const tdAcoes = document.createElement("td");
    tdAcoes.classList.add("table-actions");

    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.textContent = "Editar";
    btnEdit.addEventListener("click", () => {
      slotIdInput.value = slot.id;
      slotDataInput.value = slot.data;
      slotHoraInicioInput.value = slot.horaInicio;
      slotHoraFimInput.value = slot.horaFim;
      slotSalaSelect.value = slot.salaId;
      slotMedicoSelect.value = slot.medicoId || "";
      slotObsTextarea.value = slot.obs || "";
      clearExtraDates();
abrirModalAgenda("Editar horário");

      abrirModalAgenda("Editar horário");
    });

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.textContent = "Excluir";
    btnDel.addEventListener("click", async () => {
      if (!confirm("Excluir horário da agenda?")) return;
      try {
        await apiDeleteAgendaSlot(slot.id);
        agendaSlots = agendaSlots.filter((s) => s.id !== slot.id);
        renderAgendaAll();
        updateCallDisponibilizados();
      } catch (err) {
        alert(err.message || "Erro ao excluir horário.");
      }
    });

    tdAcoes.appendChild(btnEdit);
    tdAcoes.appendChild(btnDel);

    tr.appendChild(tdData);
    tr.appendChild(tdHora);
    tr.appendChild(tdSala);
    tr.appendChild(tdMedico);
    tr.appendChild(tdObs);
    tr.appendChild(tdAcoes);

    tableAgendaBody.appendChild(tr);
  });
}

// GRADE
function renderAgendaGrade() {
  tableAgendaGradeHead.innerHTML = "";
  tableAgendaGradeBody.innerHTML = "";

  const data = agendaDataInput.value;
  if (!data) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = salas.length + 1;
    td.textContent = "Selecione uma data para ver a grade.";
    tr.appendChild(td);
    tableAgendaGradeBody.appendChild(tr);
    return;
  }

  const medicoFiltro = agendaMedicoSelect.value ? Number(agendaMedicoSelect.value) : null;
  const salaFiltro = agendaSalaSelect.value ? Number(agendaSalaSelect.value) : null;

  const thHora = document.createElement("th");
  thHora.textContent = "Hora";
  tableAgendaGradeHead.appendChild(thHora);

  const salasVisiveis = salas.filter((s) => (salaFiltro ? s.id === salaFiltro : true));

  salasVisiveis.forEach((s) => {
    const thSala = document.createElement("th");
    thSala.textContent = s.nome;
    tableAgendaGradeHead.appendChild(thSala);
  });

  const dateObj = new Date(data + "T00:00");
  const dow = dateObj.getDay(); // 0=Dom

  let horaInicio = 7;
  let horaFim = 18;

  if (dow === 6) {
    horaFim = 12;
  } else if (dow === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = salasVisiveis.length + 1;
    td.textContent = "Domingo (sem horário padrão configurado).";
    tr.appendChild(td);
    tableAgendaGradeBody.appendChild(tr);
    return;
  }

  for (let h = horaInicio; h < horaFim; h++) {
    const inicio = `${pad2(h)}:00`;
    const fim = `${pad2(h + 1)}:00`;
    const rowStartMin = h * 60;
    const rowEndMin = (h + 1) * 60;

    const tr = document.createElement("tr");
    const tdHora = document.createElement("td");
    tdHora.textContent = `${inicio} - ${fim}`;
    tr.appendChild(tdHora);

    salasVisiveis.forEach((sala) => {
      const td = document.createElement("td");

      const slot = agendaSlots.find((sl) => {
        if (sl.data !== data) return false;
        if (sl.salaId !== sala.id) return false;
        if (!sl.medicoId) return false;
        if (medicoFiltro && sl.medicoId !== medicoFiltro) return false;

        const [sh, sm] = sl.horaInicio.split(":").map(Number);
        const [eh, em] = sl.horaFim.split(":").map(Number);
        const slotStart = sh * 60 + sm;
        const slotEnd = eh * 60 + em;

        return slotStart < rowEndMin && slotEnd > rowStartMin;
      });

      if (slot) {
        td.textContent = getMedicoNome(slot.medicoId);
      }

      tr.appendChild(td);
    });

    tableAgendaGradeBody.appendChild(tr);
  }
}

// CALENDÁRIO
function renderAgendaCalendario() {
  agendaCalendarioGrid.innerHTML = "";

  let mesStr = agendaMesInput.value;
  if (!mesStr) {
    if (agendaDataInput.value) {
      mesStr = agendaDataInput.value.slice(0, 7);
      agendaMesInput.value = mesStr;
    } else {
      return;
    }
  }

  const [anoStr, mesStr2] = mesStr.split("-");
  const ano = Number(anoStr);
  const mes = Number(mesStr2) - 1;

  const firstDay = new Date(ano, mes, 1);
  const firstDow = firstDay.getDay();
  const daysInMonth = new Date(ano, mes + 1, 0).getDate();

  const medicoFiltro = agendaMedicoSelect.value ? Number(agendaMedicoSelect.value) : null;

  const semana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  semana.forEach((nomeDia) => {
    const cell = document.createElement("div");
    cell.classList.add("cal-cell", "cal-header");
    cell.textContent = nomeDia;
    agendaCalendarioGrid.appendChild(cell);
  });

  for (let i = 0; i < firstDow; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cal-cell");
    agendaCalendarioGrid.appendChild(cell);
  }

  for (let dia = 1; dia <= daysInMonth; dia++) {
    const diaStr = `${ano}-${pad2(mes + 1)}-${pad2(dia)}`;

    const hasAgenda = agendaSlots.some((slot) => {
      if (slot.data !== diaStr) return false;
      if (medicoFiltro && slot.medicoId !== medicoFiltro) return false;
      return true;
    });

    const cell = document.createElement("div");
    cell.classList.add("cal-cell");
    if (hasAgenda) cell.classList.add("cal-has-agenda");

    const spanDia = document.createElement("span");
    spanDia.classList.add("cal-day");
    spanDia.textContent = dia;

    cell.appendChild(spanDia);
    agendaCalendarioGrid.appendChild(cell);
  }
}

// RESUMO
function renderAgendaResumoMes() {
  resumoSalasTotal.textContent = salas.length.toString();

  let mesStr = agendaMesInput.value;
  if (!mesStr) {
    resumoSalasOcupadas.textContent = "0";
    resumoHorasPossiveis.textContent = "0";
    resumoHorasUsadas.textContent = "0";
    resumoOcupacaoPercent.textContent = "0%";
    return;
  }

  const [anoStr, mesStr2] = mesStr.split("-");
  const ano = Number(anoStr);
  const mes = Number(mesStr2) - 1;

  const daysInMonth = new Date(ano, mes + 1, 0).getDate();

  let horasPossiveisBase = 0;

  for (let dia = 1; dia <= daysInMonth; dia++) {
    const d = new Date(ano, mes, dia);
    const dow = d.getDay();
    let horasDia = 0;

    if (dow >= 1 && dow <= 5) horasDia = 11;
    else if (dow === 6) horasDia = 5;

    horasPossiveisBase += horasDia * salas.length;
  }

  let horasUsadas = 0;
  let extraHoras = 0;
  const salasOcupadasSet = new Set();

  agendaSlots.forEach((slot) => {
    if (!slot.data || !slot.horaInicio || !slot.horaFim) return;
    if (!slot.data.startsWith(mesStr)) return;

    salasOcupadasSet.add(slot.salaId);

    const [hIni, mIni] = slot.horaInicio.split(":").map(Number);
    const [hFim, mFim] = slot.horaFim.split(":").map(Number);
    const slotStart = hIni * 60 + mIni;
    const slotEnd = hFim * 60 + mFim;
    const minutos = slotEnd - slotStart;
    if (minutos <= 0) return;
    const horas = minutos / 60;

    horasUsadas += horas;

    const d = new Date(slot.data + "T00:00");
    const dow = d.getDay();
    let stdStart = 0;
    let stdEnd = 0;

    if (dow >= 1 && dow <= 5) {
      stdStart = 7 * 60;
      stdEnd = 18 * 60;
    } else if (dow === 6) {
      stdStart = 7 * 60;
      stdEnd = 12 * 60;
    } else {
      extraHoras += horas;
      return;
    }

    const overlapStart = Math.max(slotStart, stdStart);
    const overlapEnd = Math.min(slotEnd, stdEnd);
    let overlapMin = 0;
    if (overlapEnd > overlapStart) overlapMin = overlapEnd - overlapStart;

    const extraMin = minutos - overlapMin;
    if (extraMin > 0) {
      extraHoras += extraMin / 60;
    }
  });

  const horasPossiveis = horasPossiveisBase + extraHoras;

  resumoSalasOcupadas.textContent = salasOcupadasSet.size.toString();
  resumoHorasPossiveis.textContent = horasPossiveis.toFixed(1);
  resumoHorasUsadas.textContent = horasUsadas.toFixed(1);

  const ocupacao =
    horasPossiveis > 0 ? ((horasUsadas / horasPossiveis) * 100).toFixed(1) : "0.0";
  resumoOcupacaoPercent.textContent = ocupacao + "%";
}

// filtros
formFiltroAgenda.addEventListener("submit", (e) => {
  e.preventDefault();
  renderAgendaAll();
});

agendaDataInput.addEventListener("change", renderAgendaAll);
agendaSalaSelect.addEventListener("change", renderAgendaAll);
agendaMedicoSelect.addEventListener("change", renderAgendaAll);

// salvar slot agenda
formAgendaSlot.addEventListener("submit", async (e) => {
  e.preventDefault();
  const dataPrincipal = slotDataInput.value;
  const horaInicio = slotHoraInicioInput.value;
  const horaFim = slotHoraFimInput.value;
  const salaId = Number(slotSalaSelect.value);
  const medicoId = slotMedicoSelect.value ? Number(slotMedicoSelect.value) : null;
  const obs = slotObsTextarea.value.trim();

  if (!dataPrincipal || !horaInicio || !horaFim || !salaId) {
    alert("Preencha data, horário e sala.");
    return;
  }

  const idEdicao = slotIdInput.value ? Number(slotIdInput.value) : null;

  // Coletar datas adicionais (se houver)
  let datasAdicionais = [];
  if (extraDatesContainer) {
    datasAdicionais = Array.from(
      extraDatesContainer.querySelectorAll("input.slot-extra-date")
    )
      .map((inp) => inp.value)
      .filter((v) => v && v !== dataPrincipal);
  }

  try {
    if (idEdicao) {
      // Edição: só atualiza o slot principal
      const slotSalvo = await apiSaveAgendaSlot(
        idEdicao,
        dataPrincipal,
        horaInicio,
        horaFim,
        salaId,
        medicoId,
        obs
      );
      const slot = agendaSlots.find((s) => s.id === idEdicao);
      if (slot) {
        Object.assign(slot, slotSalvo);
      }
    } else {
      // Novo: cria 1 slot para a data principal + 1 para cada data adicional
      const todasDatas = [dataPrincipal, ...datasAdicionais];
      for (const data of todasDatas) {
        const slotSalvo = await apiSaveAgendaSlot(
          null,
          data,
          horaInicio,
          horaFim,
          salaId,
          medicoId,
          obs
        );
        agendaSlots.push(slotSalvo);
      }
    }

    fecharModalAgenda();
    renderAgendaAll();
    updateCallDisponibilizados();
  } catch (err) {
    alert(err.message || "Erro ao salvar horário.");
  }
});


agendaMesInput.addEventListener("change", () => {
  renderAgendaCalendario();
  renderAgendaResumoMes();
});

// ====================== CALL CENTER ======================

const formCall = document.getElementById("form-call");
const callIdInput = document.getElementById("call-id");
const callDataInput = document.getElementById("call-data");
const callDispInput = document.getElementById("call-disponibilizados");
const callAgendInput = document.getElementById("call-agendados");
const callConfInput = document.getElementById("call-confirmados");
const callAtendInput = document.getElementById("call-atendidos");
const callLimparBtn = document.getElementById("call-limpar");
const tableCallBody = document.querySelector("#table-call tbody");

const callMesResumoInput = document.getElementById("call-mes-resumo");
const callSumDisp = document.getElementById("call-sum-disp");
const callSumAg = document.getElementById("call-sum-ag");
const callSumConf = document.getElementById("call-sum-conf");
const callSumAt = document.getElementById("call-sum-at");
const callPercAg = document.getElementById("call-perc-ag");
const callPercConf = document.getElementById("call-perc-conf");
const callPercAt = document.getElementById("call-perc-at");

function calcularPerc(parte, total) {
  if (!total || total === 0) return "";
  return ((parte / total) * 100).toFixed(1) + "%";
}

function updateCallDisponibilizados() {
  const data = callDataInput.value;
  if (!data) {
    callDispInput.value = 0;
    return;
  }
  const profissionalId = callProfSelect.value ? Number(callProfSelect.value) : null;

  let total = 0;
  const slotsDoDia = agendaSlots.filter((s) => s.data === data);

  slotsDoDia.forEach((s) => {
    if (profissionalId && s.medicoId !== profissionalId) return;
    if (!s.medicoId) return;

    const med = medicos.find((m) => m.id === s.medicoId);
    if (!med || !med.pacientesHora) return;

    const [hIni, mIni] = s.horaInicio.split(":").map(Number);
    const [hFim, mFim] = s.horaFim.split(":").map(Number);
    const minutos = hFim * 60 + mFim - (hIni * 60 + mIni);
    if (minutos <= 0) return;
    const horas = minutos / 60;

    total += med.pacientesHora * horas;
  });

  callDispInput.value = Math.round(total);
}

function renderCall() {
  tableCallBody.innerHTML = "";

  const lista = [...callEntries].sort((a, b) => a.data.localeCompare(b.data));

  lista.forEach((c) => {
    const tr = document.createElement("tr");

    const tdData = document.createElement("td");
    tdData.textContent = c.data.split("-").reverse().join("/");

    const tdProf = document.createElement("td");
    tdProf.textContent = c.profissionalId ? getMedicoNome(c.profissionalId) : "Geral";

    const tdDisp = document.createElement("td");
    tdDisp.textContent = c.disponibilizados ?? 0;

    const tdAg = document.createElement("td");
    tdAg.textContent = c.agendados;

    const tdPercAg = document.createElement("td");
    tdPercAg.textContent = calcularPerc(c.agendados, c.disponibilizados ?? 0);

    const tdConf = document.createElement("td");
    tdConf.textContent = c.confirmados;

    const tdPercConf = document.createElement("td");
    tdPercConf.textContent = calcularPerc(c.confirmados, c.agendados);

    const tdAt = document.createElement("td");
    tdAt.textContent = c.atendidos;

    const tdPercAt = document.createElement("td");
    tdPercAt.textContent = calcularPerc(c.atendidos, c.confirmados);

    const tdAcoes = document.createElement("td");
    tdAcoes.classList.add("table-actions");

    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.textContent = "Editar";
    btnEdit.addEventListener("click", () => {
      callIdInput.value = c.id;
      callDataInput.value = c.data;
      callProfSelect.value = c.profissionalId || "";
      callDispInput.value = c.disponibilizados ?? 0;
      callAgendInput.value = c.agendados;
      callConfInput.value = c.confirmados;
      callAtendInput.value = c.atendidos;
      callDataInput.scrollIntoView({ behavior: "smooth", block: "center" });
      callDataInput.focus();
      updateCallDisponibilizados();
    });

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.textContent = "Excluir";
    btnDel.addEventListener("click", async () => {
      if (!confirm("Excluir registro de call?")) return;
      try {
        await apiDeleteCallEntry(c.id);
        callEntries = callEntries.filter((x) => x.id !== c.id);
        renderCall();
        renderCallResumo();
      } catch (err) {
        alert(err.message || "Erro ao excluir registro.");
      }
    });

    tdAcoes.appendChild(btnEdit);
    tdAcoes.appendChild(btnDel);

    tr.appendChild(tdData);
    tr.appendChild(tdProf);
    tr.appendChild(tdDisp);
    tr.appendChild(tdAg);
    tr.appendChild(tdPercAg);
    tr.appendChild(tdConf);
    tr.appendChild(tdPercConf);
    tr.appendChild(tdAt);
    tr.appendChild(tdPercAt);
    tr.appendChild(tdAcoes);

    tableCallBody.appendChild(tr);
  });
}

function renderCallResumo() {
  let mesStr = callMesResumoInput.value;
  if (!mesStr) {
    callSumDisp.textContent = "0";
    callSumAg.textContent = "0";
    callSumConf.textContent = "0";
    callSumAt.textContent = "0";
    callPercAg.textContent = "0%";
    callPercConf.textContent = "0%";
    callPercAt.textContent = "0%";
    return;
  }

  const entriesMes = callEntries.filter((c) => c.data && c.data.startsWith(mesStr));

  let disp = 0;
  let ag = 0;
  let conf = 0;
  let at = 0;

  entriesMes.forEach((c) => {
    disp += Number(c.disponibilizados || 0);
    ag += Number(c.agendados || 0);
    conf += Number(c.confirmados || 0);
    at += Number(c.atendidos || 0);
  });

  callSumDisp.textContent = disp.toString();
  callSumAg.textContent = ag.toString();
  callSumConf.textContent = conf.toString();
  callSumAt.textContent = at.toString();

  callPercAg.textContent = disp > 0 ? ((ag / disp) * 100).toFixed(1) + "%" : "0%";
  callPercConf.textContent = ag > 0 ? ((conf / ag) * 100).toFixed(1) + "%" : "0%";
  callPercAt.textContent = conf > 0 ? ((at / conf) * 100).toFixed(1) + "%" : "0%";
}

formCall.addEventListener("submit", async (e) => {
  e.preventDefault();

  updateCallDisponibilizados();

  const data = callDataInput.value;
  const profissionalId = callProfSelect.value ? Number(callProfSelect.value) : null;
  const disponibilizados = Number(callDispInput.value || 0);
  const agendados = Number(callAgendInput.value || 0);
  const confirmados = Number(callConfInput.value || 0);
  const atendidos = Number(callAtendInput.value || 0);

  if (!data) {
    alert("Informe a data.");
    return;
  }

  const idEdicao = callIdInput.value ? Number(callIdInput.value) : null;

  try {
    const entrySalva = await apiSaveCallEntry(
      idEdicao,
      data,
      profissionalId,
      disponibilizados,
      agendados,
      confirmados,
      atendidos
    );

    if (idEdicao) {
      const c = callEntries.find((x) => x.id === idEdicao);
      if (c) {
        Object.assign(c, entrySalva);
      }
    } else {
      callEntries.push(entrySalva);
    }

    callIdInput.value = "";
    formCall.reset();
    updateCallDisponibilizados();
    renderCall();
    renderCallResumo();
  } catch (err) {
    alert(err.message || "Erro ao salvar registro de call.");
  }
});

callLimparBtn.addEventListener("click", () => {
  callIdInput.value = "";
  formCall.reset();
  updateCallDisponibilizados();
});

callDataInput.addEventListener("change", updateCallDisponibilizados);
callProfSelect.addEventListener("change", updateCallDisponibilizados);
callMesResumoInput.addEventListener("change", renderCallResumo);

// ====================== INIT ======================

function renderAgendaAll() {
  renderAgendaLista();
  renderAgendaGrade();
  renderAgendaCalendario();
  renderAgendaResumoMes();
}

async function init() {
  try {
    await apiListAll();
  } catch (err) {
    alert(err.message || "Erro ao carregar dados do servidor.");
    salas = [];
    especialidades = [];
    medicos = [];
    agendaSlots = [];
    callEntries = [];
  }

  renderSalas();
  renderEspecialidades();
  renderMedicos();
  renderSelectsGlobais();

  const hojeDate = new Date();
  const hoje =
    hojeDate.getFullYear() +
    "-" +
    pad2(hojeDate.getMonth() + 1) +
    "-" +
    pad2(hojeDate.getDate());

  agendaDataInput.value = hoje;
  callDataInput.value = hoje;

  const mesAtual = hoje.slice(0, 7);
  agendaMesInput.value = mesAtual;
  callMesResumoInput.value = mesAtual;

  renderAgendaAll();
  renderCall();
  renderCallResumo();
  updateCallDisponibilizados();
}

// ao carregar a página, mostra o login
verificarSessaoLogin();
