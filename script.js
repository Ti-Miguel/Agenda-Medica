// ====================== LOGIN / SESSÃO ======================

const LOGIN_STORAGE_KEY = "maringa_agenda_logged";
const LOGIN_USER = "agendamaringa";
const LOGIN_PASS = "amor@100";

function mostrarApp() {
  const app = document.getElementById("app");
  const login = document.getElementById("login-screen");
  if (app) app.style.display = "flex";
  if (login) login.style.display = "none";
}

function mostrarLogin() {
  const app = document.getElementById("app");
  const login = document.getElementById("login-screen");
  if (app) app.style.display = "none";
  if (login) login.style.display = "flex";
}

function initLogin() {
  const loginForm = document.getElementById("login-form");
  const userInput = document.getElementById("login-usuario");
  const passInput = document.getElementById("login-senha");
  const msgEl = document.getElementById("login-msg");

  if (!loginForm || !userInput || !passInput) {
    if (typeof init === "function") {
      init();
    }
    return;
  }

  userInput.value = LOGIN_USER;
  userInput.readOnly = true;

  if (sessionStorage.getItem(LOGIN_STORAGE_KEY) === "1") {
    mostrarApp();
    if (typeof init === "function") {
      init();
    }
  } else {
    mostrarLogin();
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const usuario = userInput.value.trim().toLowerCase();
    const senha = passInput.value;

    if (usuario === LOGIN_USER && senha === LOGIN_PASS) {
      sessionStorage.setItem(LOGIN_STORAGE_KEY, "1");
      if (msgEl) msgEl.textContent = "";
      mostrarApp();
      if (typeof init === "function") {
        init();
      }
    } else {
      if (msgEl) {
        msgEl.textContent = "Usuário ou senha inválidos.";
      } else {
        alert("Usuário ou senha inválidos.");
      }
    }
  });
}

// ====================== API HELPERS (PHP) ======================

const API_BASE = "api.php";

async function apiGet(action, params = {}) {
  const url = new URL(API_BASE, window.location.href);
  url.searchParams.set("action", action);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const json = await res.json().catch(() => null);
  if (!json || json.success === undefined) {
    throw new Error("Resposta inválida da API.");
  }
  if (!json.success) {
    throw new Error(json.error || "Erro na API.");
  }
  return json;
}

async function apiPost(action, data = {}) {
  const url = `${API_BASE}?action=${encodeURIComponent(action)}`;
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && v !== null) {
      body.append(k, v);
    }
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  const json = await res.json().catch(() => null);
  if (!json || json.success === undefined) {
    throw new Error("Resposta inválida da API.");
  }
  if (!json.success) {
    throw new Error(json.error || "Erro na API.");
  }
  return json;
}

function showError(msg, err) {
  console.error(msg, err);
  if (msg) alert(msg);
}

function pad2(n) {
  return n.toString().padStart(2, "0");
}

// ====================== ESTADO ======================

let salas = [];
let especialidades = [];
let medicos = [];
let agendaSlots = [];
let callEntries = [];
let cancelamentos = [];
let mapaConfigPorData = {};

// ====================== NAV / VIEWS ======================

const menuItems = document.querySelectorAll(".menu-item");
const views = document.querySelectorAll(".view");
const viewTitle = document.getElementById("view-title");
// Botão para voltar ao Hub
const btnHub = document.getElementById("btn-hub");

// URL do seu Hub (ajuste aqui se for outro endereço)
const HUB_URL = "https://amorsaudemaringa.com/hub.html"; // 🔁 TROCAR SE PRECISAR

if (btnHub) {
  btnHub.addEventListener("click", () => {
    window.location.href = HUB_URL;
  });
}


menuItems.forEach((btn) => {
  btn.addEventListener("click", () => {
    menuItems.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const viewName = btn.dataset.view;
    viewTitle.textContent =
      viewName === "agenda"
        ? "Agenda"
        : viewName === "cadastros"
        ? "Cadastros"
        : viewName === "callcenter"
        ? "Call Center"
        : viewName === "cancelamentos"
        ? "Cancelamentos"
        : "Configuração do mapa";

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

function getMedicoPorId(id) {
  return medicos.find((m) => m.id === id) || null;
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
        await apiPost("salas.delete", { id: sala.id });
        await loadSalas();
        renderSalas();
        renderSelectsGlobais();
        updateCallDisponibilizados();
        renderAgendaResumoMes();
        renderAgendaGrade();
      } catch (err) {
        showError("Erro ao excluir sala.", err);
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

formSala.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = salaNomeInput.value.trim();
  if (!nome) return;

  const idEdicao = salaIdInput.value ? Number(salaIdInput.value) : null;

  try {
    await apiPost("salas.save", {
      id: idEdicao || "",
      nome,
    });
    salaIdInput.value = "";
    salaNomeInput.value = "";
    await loadSalas();
    renderSalas();
    renderSelectsGlobais();
    updateCallDisponibilizados();
    renderAgendaResumoMes();
    renderAgendaGrade();
  } catch (err) {
    showError("Erro ao salvar sala.", err);
  }
});

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
        await apiPost("especialidades.delete", { id: esp.id });
        await loadEspecialidades();
        renderEspecialidades();
        renderSelectsGlobais();
      } catch (err) {
        showError("Erro ao excluir especialidade.", err);
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

formEsp.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = espNomeInput.value.trim();
  if (!nome) return;

  const idEdicao = espIdInput.value ? Number(espIdInput.value) : null;

  try {
    await apiPost("especialidades.save", {
      id: idEdicao || "",
      nome,
    });
    espIdInput.value = "";
    espNomeInput.value = "";
    await loadEspecialidades();
    renderEspecialidades();
    renderSelectsGlobais();
  } catch (err) {
    showError("Erro ao salvar especialidade.", err);
  }
});

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
    tdPac.textContent = med.pacientesHora ?? "";

    const tdAcoes = document.createElement("td");
    tdAcoes.classList.add("table-actions");

    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.textContent = "Editar";
    btnEdit.addEventListener("click", () => {
      medicoIdInput.value = med.id;
      medicoNomeInput.value = med.nome;
      medicoEspSelect.value = med.especialidadeId || "";
      medicoPacientesHoraInput.value = med.pacientesHora ?? 0;
      medicoNomeInput.scrollIntoView({ behavior: "smooth", block: "center" });
      medicoNomeInput.focus();
    });

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.textContent = "Excluir";
    btnDel.addEventListener("click", async () => {
      if (!confirm("Excluir médico/profissional?")) return;
      try {
        await apiPost("medicos.delete", { id: med.id });
        await loadMedicos();
        renderMedicos();
        renderSelectsGlobais();
        updateCallDisponibilizados();
        renderAgendaResumoMes();
      } catch (err) {
        showError("Erro ao excluir médico.", err);
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

formMedico.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = medicoNomeInput.value.trim();
  if (!nome) return;

  const espId = medicoEspSelect.value ? Number(medicoEspSelect.value) : null;
  const pacientesHora = Number(medicoPacientesHoraInput.value || 0) || 0;

  const idEdicao = medicoIdInput.value ? Number(medicoIdInput.value) : null;

  try {
    await apiPost("medicos.save", {
      id: idEdicao || "",
      nome,
      especialidadeId: espId ?? "",
      pacientesHora,
    });

    medicoIdInput.value = "";
    medicoNomeInput.value = "";
    medicoEspSelect.value = "";
    medicoPacientesHoraInput.value = 0;

    await loadMedicos();
    renderMedicos();
    renderSelectsGlobais();
    updateCallDisponibilizados();
    renderAgendaResumoMes();
  } catch (err) {
    showError("Erro ao salvar médico.", err);
  }
});

// ====================== SELECTS GLOBAIS ======================

const agendaSalaSelect = document.getElementById("agenda-sala");
const agendaMedicoSelect = document.getElementById("agenda-medico");
const slotSalaSelect = document.getElementById("slot-sala");
const slotMedicoSelect = document.getElementById("slot-medico");
const callProfSelect = document.getElementById("call-profissional");

// Cancelamentos
const cancelMedicoSelect = document.getElementById("cancel-medico");
const cancelFiltroMedicoSelect = document.getElementById("cancel-filtro-medico");
const cancelEspInput = document.getElementById("cancel-especialidade");

function renderSelectsGlobais() {
  // Especialidades no cadastro médico
  medicoEspSelect.innerHTML = `<option value="">(sem)</option>`;
  especialidades.forEach((esp) => {
    const opt = document.createElement("option");
    opt.value = esp.id;
    opt.textContent = esp.nome;
    medicoEspSelect.appendChild(opt);
  });

  // Salas em filtros e modal de slot
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

  // Médicos em filtros, modal slot, call center e cancelamentos
  agendaMedicoSelect.innerHTML = `<option value="">Todos</option>`;
  slotMedicoSelect.innerHTML = `<option value="">Sem vínculo</option>`;
  callProfSelect.innerHTML = `<option value="">Geral</option>`;
  if (cancelMedicoSelect) {
    cancelMedicoSelect.innerHTML = `<option value="">Selecione...</option>`;
  }
  if (cancelFiltroMedicoSelect) {
    cancelFiltroMedicoSelect.innerHTML = `<option value="">Todos</option>`;
  }

  const medicosOrdenados = [...medicos].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR")
  );

  medicosOrdenados.forEach((m) => {
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

    if (cancelMedicoSelect) {
      const opt4 = document.createElement("option");
      opt4.value = m.id;
      opt4.textContent = m.nome;
      cancelMedicoSelect.appendChild(opt4);
    }

    if (cancelFiltroMedicoSelect) {
      const opt5 = document.createElement("option");
      opt5.value = m.id;
      opt5.textContent = m.nome;
      cancelFiltroMedicoSelect.appendChild(opt5);
    }
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

// Resumo de ocupação
const resumoSalasTotal = document.getElementById("resumo-salas-total");
const resumoSalasOcupadas = document.getElementById("resumo-salas-ocupadas");
const resumoHorasPossiveis = document.getElementById("resumo-horas-possiveis");
const resumoHorasUsadas = document.getElementById("resumo-horas-usadas");
const resumoOcupacaoPercent = document.getElementById("resumo-ocupacao-percent");

// dias adicionais
const btnAddExtraDate = document.getElementById("btn-add-extra-date");
const slotExtraDatesContainer = document.getElementById("slot-extra-dates-container");


// ===== Eventos da AGENDA (data / filtros / mês) =====

if (formFiltroAgenda) {
  formFiltroAgenda.addEventListener("submit", (e) => {
    e.preventDefault();
    renderAgendaAll();
  });
}

if (agendaDataInput) {
  agendaDataInput.addEventListener("change", () => {
    renderAgendaAll();
  });
}

if (agendaSalaSelect) {
  agendaSalaSelect.addEventListener("change", () => {
    renderAgendaAll();
  });
}

if (agendaMedicoSelect) {
  agendaMedicoSelect.addEventListener("change", () => {
    renderAgendaAll();
  });
}

if (agendaMesInput) {
  agendaMesInput.addEventListener("change", () => {
    renderAgendaAll();
  });
}

// ----------------------------------------------

function abrirModalAgenda(titulo = "Novo horário") {
  modalAgendaTitle.textContent = titulo;
  modalAgendaBackdrop.classList.add("active");
}

function fecharModalAgenda() {
  modalAgendaBackdrop.classList.remove("active");
}

if (modalAgendaClose) {
  modalAgendaClose.addEventListener("click", fecharModalAgenda);
}
if (btnCancelarSlot) {
  btnCancelarSlot.addEventListener("click", fecharModalAgenda);
}

btnNovoSlot.addEventListener("click", () => {
  slotIdInput.value = "";
  slotDataInput.value = agendaDataInput.value || "";
  slotHoraInicioInput.value = "";
  slotHoraFimInput.value = "";
  slotSalaSelect.value = "";
  slotMedicoSelect.value = "";
  slotObsTextarea.value = "";

  // limpa sempre os dias extras ao abrir um novo cadastro
  if (slotExtraDatesContainer) {
    slotExtraDatesContainer.innerHTML = "";
  }

  abrirModalAgenda("Novo horário");
});


// ================== DIAS ADICIONAIS (EXTRA DATES) ==================

function criarCampoExtraDate(valor = "") {
  const wrapper = document.createElement("div");
  wrapper.classList.add("slot-extra-date-row");

  const input = document.createElement("input");
  input.type = "date";
  input.classList.add("slot-extra-date");
  if (valor) input.value = valor;

  const btnRem = document.createElement("button");
  btnRem.type = "button";
  btnRem.textContent = "X";
  btnRem.classList.add("btn-remove-extra-date");
  btnRem.addEventListener("click", () => {
    wrapper.remove();
  });

  wrapper.appendChild(input);
  wrapper.appendChild(btnRem);
  return wrapper;
}

if (btnAddExtraDate && slotExtraDatesContainer) {
  btnAddExtraDate.addEventListener("click", () => {
    const row = criarCampoExtraDate();
    slotExtraDatesContainer.appendChild(row);
  });
}



// >>>>>>> SALVAR HORÁRIO DA AGENDA (NOVO / EDIÇÃO) <<<<<<<
if (formAgendaSlot) {
formAgendaSlot.addEventListener("submit", async (e) => {
  e.preventDefault();

  const idEdicao = slotIdInput.value ? Number(slotIdInput.value) : null;
  const dataPrincipal = slotDataInput.value;
  const horaInicio = slotHoraInicioInput.value;
  const horaFim = slotHoraFimInput.value;
  const salaId = Number(slotSalaSelect.value || 0);
  const medicoId = slotMedicoSelect.value ? Number(slotMedicoSelect.value) : "";
  const obs = slotObsTextarea.value.trim();

  if (!dataPrincipal || !horaInicio || !horaFim || !salaId) {
    alert("Preencha data, horário e sala.");
    return;
  }

  // Monta lista de datas: principal + extras (sem repetir)
  const datas = [dataPrincipal];

  if (slotExtraDatesContainer) {
    const inputsExtra = slotExtraDatesContainer.querySelectorAll(".slot-extra-date");
    inputsExtra.forEach((inp) => {
      const v = inp.value;
      if (v && !datas.includes(v)) {
        datas.push(v);
      }
    });
  }

  try {
    if (idEdicao) {
      // EDIÇÃO: altera somente a data principal (não mexe em outros dias)
      await apiPost("agenda.save", {
        id: idEdicao,
        data: dataPrincipal,
        horaInicio,
        horaFim,
        salaId,
        medicoId,
        obs,
      });
    } else {
      // NOVO: cria um slot para CADA data (principal + extras)
      for (const data of datas) {
        await apiPost("agenda.save", {
          id: "",
          data,
          horaInicio,
          horaFim,
          salaId,
          medicoId,
          obs,
        });
      }
    }

    // Fechar modal e limpar campos
    fecharModalAgenda();
    slotIdInput.value = "";
    if (slotExtraDatesContainer) {
      slotExtraDatesContainer.innerHTML = "";
    }

    await loadAgendaSlots();
    renderAgendaAll();
    updateCallDisponibilizados();
  } catch (err) {
    showError("Erro ao salvar horário da agenda.", err);
  }
});

}

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
    if (view === "calendario")
      agendaSubviewCalendario.classList.add("agenda-subview-active");
    if (view === "grade") agendaSubviewGrade.classList.add("agenda-subview-active");
  });
});

// LISTA DA AGENDA

function renderAgendaLista() {
  const dataFiltro = agendaDataInput.value;
  const salaFiltro = agendaSalaSelect.value ? Number(agendaSalaSelect.value) : null;
  const medicoFiltro = agendaMedicoSelect.value
    ? Number(agendaMedicoSelect.value)
    : null;

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

  // edição é sempre de UMA data só → limpa campos extras
  if (slotExtraDatesContainer) {
    slotExtraDatesContainer.innerHTML = "";
  }

  abrirModalAgenda("Editar horário");
});


    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.textContent = "Excluir";
    btnDel.addEventListener("click", async () => {
      if (!confirm("Excluir horário da agenda?")) return;
      try {
        await apiPost("agenda.delete", { id: slot.id });
        await loadAgendaSlots();
        renderAgendaAll();
        updateCallDisponibilizados();
      } catch (err) {
        showError("Erro ao excluir horário da agenda.", err);
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

// GRADE DIÁRIA

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

  const medicoFiltro = agendaMedicoSelect.value
    ? Number(agendaMedicoSelect.value)
    : null;

  const salaFiltro = agendaSalaSelect.value
    ? Number(agendaSalaSelect.value)
    : null;

  const thHora = document.createElement("th");
  thHora.textContent = "Hora";
  tableAgendaGradeHead.appendChild(thHora);

  const salasVisiveis = salas.filter((s) =>
    salaFiltro ? s.id === salaFiltro : true
  );

  salasVisiveis.forEach((s) => {
    const thSala = document.createElement("th");
    thSala.textContent = s.nome;
    tableAgendaGradeHead.appendChild(thSala);
  });

  const dateObj = new Date(data + "T00:00");
  const dow = dateObj.getDay();
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

// CALENDÁRIO MENSAL

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

  const medicoFiltro = agendaMedicoSelect.value
    ? Number(agendaMedicoSelect.value)
    : null;

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

// ====================== RESUMO DE OCUPAÇÃO (USANDO MAPACONFIG) ======================

function timeToMinutes(str) {
  if (!str) return null;
  const [h, m] = str.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function getDefaultMapaConfigForDow(dow) {
  if (dow >= 1 && dow <= 5) {
    return {
      diaSemana: dow,
      ativo: 1,
      horaInicio: "07:00",
      horaFim: "18:00",
    };
  }
  if (dow === 6) {
    return {
      diaSemana: dow,
      ativo: 1,
      horaInicio: "07:00",
      horaFim: "12:00",
    };
  }
  return {
    diaSemana: dow,
    ativo: 0,
    horaInicio: null,
    horaFim: null,
  };
}

function getMapaConfigParaDiaStr(dataStr) {
  if (!dataStr) {
    return { conta: false, horaInicio: null, horaFim: null };
  }

  const override = mapaConfigPorData && mapaConfigPorData[dataStr];
  if (override) {
    return {
      conta: !!override.conta,
      horaInicio: override.horaInicio || null,
      horaFim: override.horaFim || null,
    };
  }

  const partes = dataStr.split("-");
  if (partes.length !== 3) {
    return { conta: false, horaInicio: null, horaFim: null };
  }

  const ano = Number(partes[0]);
  const mes = Number(partes[1]);
  const dia = Number(partes[2]);
  if (!ano || !mes || !dia) {
    return { conta: false, horaInicio: null, horaFim: null };
  }

  const d = new Date(ano, mes - 1, dia);
  const dow = d.getDay();

  const base = getDefaultMapaConfigForDow(dow);
  if (!base || !base.ativo) {
    return { conta: false, horaInicio: null, horaFim: null };
  }

  return {
    conta: true,
    horaInicio: base.horaInicio || null,
    horaFim: base.horaFim || null,
  };
}

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

  let horasPossiveis = 0;
  let horasUsadas = 0;
  const salasOcupadasSet = new Set();

  for (let dia = 1; dia <= daysInMonth; dia++) {
    const diaStr = ano + "-" + pad2(mes + 1) + "-" + pad2(dia);

    const conf = getMapaConfigParaDiaStr(diaStr);
    if (!conf.conta || !conf.horaInicio || !conf.horaFim) continue;

    const [hIni, mIni] = conf.horaInicio.split(":").map(Number);
    const [hFim, mFim] = conf.horaFim.split(":").map(Number);
    const min = hFim * 60 + mFim - (hIni * 60 + mIni);
    if (min <= 0) continue;

    const horasDia = min / 60;
    horasPossiveis += horasDia * salas.length;
  }

  agendaSlots.forEach((slot) => {
    if (!slot.data || !slot.horaInicio || !slot.horaFim) return;
    if (!slot.data.startsWith(mesStr)) return;

    const conf = getMapaConfigParaDiaStr(slot.data);
    if (!conf.conta || !conf.horaInicio || !conf.horaFim) return;

    const [sH, sM] = slot.horaInicio.split(":").map(Number);
    const [eH, eM] = slot.horaFim.split(":").map(Number);

    const [cH1, cM1] = conf.horaInicio.split(":").map(Number);
    const [cH2, cM2] = conf.horaFim.split(":").map(Number);

    const slotStart = sH * 60 + sM;
    const slotEnd = eH * 60 + eM;
    const confStart = cH1 * 60 + cM1;
    const confEnd = cH2 * 60 + cM2;

    const overlapStart = Math.max(slotStart, confStart);
    const overlapEnd = Math.min(slotEnd, confEnd);
    const overlapMin = overlapEnd > overlapStart ? overlapEnd - overlapStart : 0;

    if (overlapMin > 0) {
      horasUsadas += overlapMin / 60;
      salasOcupadasSet.add(slot.salaId);
    }
  });

  resumoSalasOcupadas.textContent = salasOcupadasSet.size.toString();
  resumoHorasPossiveis.textContent = horasPossiveis.toFixed(1);
  resumoHorasUsadas.textContent = horasUsadas.toFixed(1);

  const ocupacao =
    horasPossiveis > 0 ? ((horasUsadas / horasPossiveis) * 100).toFixed(1) : "0.0";
  resumoOcupacaoPercent.textContent = ocupacao + "%";
}

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
const mapaMesInput = document.getElementById("mapa-mes");

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
  const profissionalId = callProfSelect.value
    ? Number(callProfSelect.value)
    : null;

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
        await apiPost("call.delete", { id: c.id });
        await loadCallEntries();
        renderCall();
        renderCallResumo();
      } catch (err) {
        showError("Erro ao excluir registro de call.", err);
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

  const entriesMes = callEntries.filter(
    (c) => c.data && c.data.startsWith(mesStr)
  );

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
  const profissionalId = callProfSelect.value
    ? Number(callProfSelect.value)
    : null;
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
    await apiPost("call.save", {
      id: idEdicao || "",
      data,
      profissionalId: profissionalId ?? "",
      disponibilizados,
      agendados,
      confirmados,
      atendidos,
    });

    callIdInput.value = "";
    formCall.reset();
    updateCallDisponibilizados();
    await loadCallEntries();
    renderCall();
    renderCallResumo();
  } catch (err) {
    showError("Erro ao salvar registro de call.", err);
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

// ====================== CANCELAMENTOS ======================

const formCancel = document.getElementById("form-cancel");
const cancelIdInput = document.getElementById("cancel-id");
const cancelDataInput = document.getElementById("cancel-data");
const cancelHoraInicioInput = document.getElementById("cancel-hora-inicio");
const cancelHoraFimInput = document.getElementById("cancel-hora-fim");
const cancelMotivoInput = document.getElementById("cancel-motivo");

const cancelFiltroDataIni = document.getElementById("cancel-filtro-data-inicio");
const cancelFiltroDataFim = document.getElementById("cancel-filtro-data-fim");
const cancelCountEl = document.getElementById("cancel-count");

const tableCancelBody = document.querySelector("#table-cancelamentos tbody");

// Sempre que mudar o médico, preenche a especialidade automaticamente
if (cancelMedicoSelect) {
  cancelMedicoSelect.addEventListener("change", () => {
    const medicoId = cancelMedicoSelect.value
      ? Number(cancelMedicoSelect.value)
      : null;
    const med = medicoId ? getMedicoPorId(medicoId) : null;

    if (cancelEspInput) {
      cancelEspInput.value =
        med && med.especialidadeId
          ? getEspecialidadeNome(med.especialidadeId)
          : "";
    }
  });
}

function renderCancelamentos() {
  if (!tableCancelBody) return;

  tableCancelBody.innerHTML = "";

  let lista = [...cancelamentos];

  const medicoFiltro =
    cancelFiltroMedicoSelect && cancelFiltroMedicoSelect.value
      ? Number(cancelFiltroMedicoSelect.value)
      : null;

  const dataIni =
    cancelFiltroDataIni && cancelFiltroDataIni.value
      ? cancelFiltroDataIni.value
      : null;

  const dataFim =
    cancelFiltroDataFim && cancelFiltroDataFim.value
      ? cancelFiltroDataFim.value
      : null;

  lista = lista.filter((c) => {
    if (medicoFiltro && c.medicoId !== medicoFiltro) return false;
    if (dataIni && c.data < dataIni) return false;
    if (dataFim && c.data > dataFim) return false;
    return true;
  });

  lista.sort((a, b) => {
    if (a.data !== b.data) return b.data.localeCompare(a.data);
    return a.horaInicio.localeCompare(b.horaInicio);
  });

  if (cancelCountEl) {
    cancelCountEl.textContent = lista.length.toString();
  }

  lista.forEach((c) => {
    const tr = document.createElement("tr");

    const tdData = document.createElement("td");
    tdData.textContent = c.data.split("-").reverse().join("/");

    const tdHora = document.createElement("td");
    tdHora.textContent = `${c.horaInicio} - ${c.horaFim}`;

    const tdMed = document.createElement("td");
    tdMed.textContent = c.medicoId ? getMedicoNome(c.medicoId) : "-";

    const tdEsp = document.createElement("td");
    tdEsp.textContent = c.especialidadeId
      ? getEspecialidadeNome(c.especialidadeId)
      : "";

    const tdMotivo = document.createElement("td");
    tdMotivo.textContent = c.motivo || "";

    const tdAcoes = document.createElement("td");
    tdAcoes.classList.add("table-actions");

    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.textContent = "Editar";
    btnEdit.addEventListener("click", () => {
      cancelIdInput.value = c.id;
      cancelDataInput.value = c.data;

      if (cancelMedicoSelect) {
        cancelMedicoSelect.value = c.medicoId || "";
      }

      if (cancelEspInput) {
        cancelEspInput.value = c.especialidadeId
          ? getEspecialidadeNome(c.especialidadeId)
          : "";
      }

      cancelHoraInicioInput.value = c.horaInicio;
      cancelHoraFimInput.value = c.horaFim;
      cancelMotivoInput.value = c.motivo || "";

      cancelDataInput.scrollIntoView({ behavior: "smooth", block: "center" });
      cancelDataInput.focus();
    });

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.textContent = "Excluir";
    btnDel.addEventListener("click", async () => {
      if (!confirm("Excluir cancelamento?")) return;
      try {
        await apiPost("cancelamentos.delete", { id: c.id });
        await loadCancelamentos();
        renderCancelamentos();
      } catch (err) {
        showError("Erro ao excluir cancelamento.", err);
      }
    });

    tdAcoes.appendChild(btnEdit);
    tdAcoes.appendChild(btnDel);

    tr.appendChild(tdData);
    tr.appendChild(tdHora);
    tr.appendChild(tdMed);
    tr.appendChild(tdEsp);
    tr.appendChild(tdMotivo);
    tr.appendChild(tdAcoes);

    tableCancelBody.appendChild(tr);
  });
}

if (formCancel) {
  formCancel.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = cancelIdInput.value ? Number(cancelIdInput.value) : null;
    const data = cancelDataInput.value;

    const medicoId =
      cancelMedicoSelect && cancelMedicoSelect.value
        ? Number(cancelMedicoSelect.value)
        : null;

    const med = medicoId ? getMedicoPorId(medicoId) : null;
    const especialidadeId = med && med.especialidadeId ? med.especialidadeId : null;

    const horaInicio = cancelHoraInicioInput.value;
    const horaFim = cancelHoraFimInput.value;
    const motivo = cancelMotivoInput.value.trim();

    if (!data || !horaInicio || !horaFim) {
      alert("Preencha data e horários.");
      return;
    }

    if (!motivo) {
      alert("Informe o motivo do cancelamento.");
      return;
    }

    try {
      await apiPost("cancelamentos.save", {
        id: id || "",
        data,
        medicoId: medicoId ?? "",
        especialidadeId: especialidadeId ?? "",
        horaInicio,
        horaFim,
        qtdCancelados: 0,
        motivo,
      });

      formCancel.reset();
      cancelIdInput.value = "";
      if (cancelEspInput) cancelEspInput.value = "";

      await loadCancelamentos();
      renderCancelamentos();
    } catch (err) {
      showError("Erro ao salvar cancelamento.", err);
    }
  });
}

if (cancelFiltroMedicoSelect) {
  cancelFiltroMedicoSelect.addEventListener("change", renderCancelamentos);
}
if (cancelFiltroDataIni) {
  cancelFiltroDataIni.addEventListener("change", renderCancelamentos);
}
if (cancelFiltroDataFim) {
  cancelFiltroDataFim.addEventListener("change", renderCancelamentos);
}

// ====================== LOADERS (BUSCAM NO BANCO) ======================

async function loadSalas() {
  try {
    const resp = await apiGet("salas.list");
    salas = resp.salas || [];
  } catch (err) {
    showError("Erro ao carregar salas.", err);
    salas = [];
  }
}

async function loadEspecialidades() {
  try {
    const resp = await apiGet("especialidades.list");
    especialidades = resp.especialidades || [];
  } catch (err) {
    showError("Erro ao carregar especialidades.", err);
    especialidades = [];
  }
}

async function loadMedicos() {
  try {
    const resp = await apiGet("medicos.list");
    medicos = resp.medicos || [];
  } catch (err) {
    showError("Erro ao carregar médicos.", err);
    medicos = [];
  }
}

async function loadAgendaSlots() {
  try {
    const resp = await apiGet("agenda.list");
    agendaSlots = resp.slots || [];
  } catch (err) {
    showError("Erro ao carregar agenda.", err);
    agendaSlots = [];
  }
}

async function loadCallEntries() {
  try {
    const resp = await apiGet("call.list");
    callEntries = resp.entries || [];
  } catch (err) {
    showError("Erro ao carregar dados do call center.", err);
    callEntries = [];
  }
}

async function loadCancelamentos() {
  try {
    const resp = await apiGet("cancelamentos.list");
    cancelamentos = resp.cancelamentos || [];
  } catch (err) {
    showError("Erro ao carregar cancelamentos.", err);
    cancelamentos = [];
  }
}

async function loadMapaConfig() {
  try {
    const resp = await apiGet("mapconfig.list");
    const cfg = resp.config;

    if (cfg && typeof cfg === "object" && !Array.isArray(cfg)) {
      mapaConfigPorData = cfg;
    } else {
      mapaConfigPorData = {};
    }
  } catch (err) {
    showError("Erro ao carregar configuração do mapa.", err);
    mapaConfigPorData = {};
  }
}

// ====================== CONFIGURAÇÃO DO MAPA (VIEW) ======================

const MAP_CONFIG_PASS = "miguel847829";

const mapaAuthForm = document.getElementById("form-mapa-auth");
const mapaSenhaInput = document.getElementById("mapa-senha");
const mapaAuthMsg = document.getElementById("mapa-auth-msg");
const mapaMesContainer = document.getElementById("mapa-mes-container");
const mapaConfigForm = document.getElementById("form-mapa-config");
const mapaConfigTableBody = document.querySelector("#table-mapa-config tbody");

const diasSemanaLabels = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

function renderMapaConfigTable() {
  if (!mapaConfigTableBody || !mapaMesInput || !mapaMesInput.value) return;

  mapaConfigTableBody.innerHTML = "";

  const [anoStr, mesStr] = mapaMesInput.value.split("-");
  const ano = Number(anoStr);
  const mes = Number(mesStr);
  if (!ano || !mes) return;

  const diasNoMes = new Date(ano, mes, 0).getDate();

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dataStr = anoStr + "-" + pad2(mes) + "-" + pad2(dia);
    const d = new Date(ano, mes - 1, dia);
    const dow = d.getDay();

    const base = getDefaultMapaConfigForDow(dow);
    const override = mapaConfigPorData && mapaConfigPorData[dataStr];

    const conta = override ? !!override.conta : !!base.ativo;
    const horaInicio = override
      ? (override.horaInicio || base.horaInicio || "")
      : (base.horaInicio || "");
    const horaFim = override
      ? (override.horaFim || base.horaFim || "")
      : (base.horaFim || "");

    const tr = document.createElement("tr");
    tr.dataset.data = dataStr;

    const tdData = document.createElement("td");
    tdData.textContent = pad2(dia) + "/" + pad2(mes) + "/" + anoStr;

    const tdDiaSemana = document.createElement("td");
    tdDiaSemana.textContent = diasSemanaLabels[dow] || `Dia ${dow}`;

    const tdConta = document.createElement("td");
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.classList.add("mapa-conta");
    chk.checked = conta;
    tdConta.appendChild(chk);

    const tdInicio = document.createElement("td");
    const inputInicio = document.createElement("input");
    inputInicio.type = "time";
    inputInicio.classList.add("mapa-hora-inicio");
    inputInicio.value = horaInicio || "";
    tdInicio.appendChild(inputInicio);

    const tdFim = document.createElement("td");
    const inputFim = document.createElement("input");
    inputFim.type = "time";
    inputFim.classList.add("mapa-hora-fim");
    inputFim.value = horaFim || "";
    tdFim.appendChild(inputFim);

    tr.appendChild(tdData);
    tr.appendChild(tdDiaSemana);
    tr.appendChild(tdConta);
    tr.appendChild(tdInicio);
    tr.appendChild(tdFim);

    mapaConfigTableBody.appendChild(tr);
  }
}

if (mapaAuthForm && mapaSenhaInput) {
  mapaAuthForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const senha = mapaSenhaInput.value || "";
    if (senha === MAP_CONFIG_PASS) {
      if (mapaAuthMsg) {
        mapaAuthMsg.textContent = "Edição liberada.";
      }
      if (mapaMesContainer) {
        mapaMesContainer.style.display = "flex";
      }
      if (mapaConfigForm) {
        mapaConfigForm.style.display = "block";
      }

      if (mapaMesInput && !mapaMesInput.value) {
        if (agendaMesInput && agendaMesInput.value) {
          mapaMesInput.value = agendaMesInput.value;
        } else {
          const hoje = new Date();
          const mesAtual =
            hoje.getFullYear() + "-" + pad2(hoje.getMonth() + 1);
          mapaMesInput.value = mesAtual;
        }
      }

      renderMapaConfigTable();
    } else {
      if (mapaAuthMsg) {
        mapaAuthMsg.textContent = "Senha incorreta.";
      } else {
        alert("Senha incorreta.");
      }
    }
  });
}

if (mapaConfigForm) {
  mapaConfigForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!mapaConfigTableBody) return;

    const rows = mapaConfigTableBody.querySelectorAll("tr");
    const novaPorData = {};

    rows.forEach((tr) => {
      const dataStr = tr.dataset.data;
      if (!dataStr) return;

      const chk = tr.querySelector(".mapa-conta");
      const inputInicio = tr.querySelector(".mapa-hora-inicio");
      const inputFim = tr.querySelector(".mapa-hora-fim");

      const conta = chk && chk.checked;
      const horaInicio = inputInicio ? (inputInicio.value || null) : null;
      const horaFim = inputFim ? (inputFim.value || null) : null;

      novaPorData[dataStr] = {
        conta,
        horaInicio,
        horaFim,
      };
    });

    try {
      await apiPost("mapconfig.save", {
        json: JSON.stringify(novaPorData),
      });

      mapaConfigPorData = novaPorData;
      alert("Configuração do mapa salva com sucesso.");
      renderAgendaResumoMes();
    } catch (err) {
      showError("Erro ao salvar configuração do mapa.", err);
    }
  });
}

if (mapaMesInput) {
  mapaMesInput.addEventListener("change", renderMapaConfigTable);
}

// ====================== INIT ======================

function renderAgendaAll() {
  renderAgendaLista();
  renderAgendaGrade();
  renderAgendaCalendario();
  renderAgendaResumoMes();
}

async function init() {
  try {
    await loadSalas();
    await loadEspecialidades();
    await loadMedicos();
    await Promise.all([
      loadAgendaSlots(),
      loadCallEntries(),
      loadCancelamentos(),
      loadMapaConfig(),
    ]);

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

    if (agendaDataInput) agendaDataInput.value = hoje;
    if (callDataInput) callDataInput.value = hoje;

    const mesAtual = hoje.slice(0, 7);
    if (agendaMesInput) agendaMesInput.value = mesAtual;
    if (callMesResumoInput) callMesResumoInput.value = mesAtual;
    if (mapaMesInput) mapaMesInput.value = mesAtual;

    renderAgendaAll();
    renderCall();
    renderCallResumo();
    updateCallDisponibilizados();
    renderCancelamentos();
  } catch (err) {
    showError("Erro ao iniciar o sistema.", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initLogin();
});
