<?php
header('Content-Type: application/json; charset=utf-8');

require 'conexao.php';

$action = $_GET['action'] ?? '';

function jsonResponse($success, $data = [], $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode(array_merge(['success' => $success], $data));
    exit;
}

/* ===================== SALAS ===================== */

if ($action === 'salas.list') {
    $sql = "SELECT id, nome FROM salas ORDER BY id ASC";
    $result = $conn->query($sql);
    if (!$result) jsonResponse(false, ['error' => $conn->error], 500);

    $salas = [];
    while ($row = $result->fetch_assoc()) {
        $salas[] = [
            'id'   => (int)$row['id'],
            'nome' => $row['nome']
        ];
    }
    jsonResponse(true, ['salas' => $salas]);
}

if ($action === 'salas.save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id   = isset($_POST['id']) && $_POST['id'] !== '' ? (int)$_POST['id'] : null;
    $nome = trim($_POST['nome'] ?? '');

    if ($nome === '') jsonResponse(false, ['error' => 'Nome da sala é obrigatório.'], 400);

    if ($id) {
        $stmt = $conn->prepare("UPDATE salas SET nome = ? WHERE id = ?");
        $stmt->bind_param("si", $nome, $id);
        $ok = $stmt->execute();
        $stmt->close();
    } else {
        $stmt = $conn->prepare("INSERT INTO salas (nome) VALUES (?)");
        $stmt->bind_param("s", $nome);
        $ok = $stmt->execute();
        $id = $stmt->insert_id;
        $stmt->close();
    }

    if (!$ok) jsonResponse(false, ['error' => $conn->error], 500);

    jsonResponse(true, ['sala' => ['id' => $id, 'nome' => $nome]]);
}

if ($action === 'salas.delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    if ($id <= 0) jsonResponse(false, ['error' => 'ID inválido.'], 400);

    $stmt = $conn->prepare("DELETE FROM salas WHERE id = ?");
    $stmt->bind_param("i", $id);
    $ok = $stmt->execute();
    $stmt->close();

    if (!$ok) jsonResponse(false, ['error' => $conn->error], 500);

    jsonResponse(true);
}

/* ===================== ESPECIALIDADES ===================== */

if ($action === 'especialidades.list') {
    $sql = "SELECT id, nome FROM especialidades ORDER BY id ASC";
    $result = $conn->query($sql);
    if (!$result) jsonResponse(false, ['error' => $conn->error], 500);

    $especialidades = [];
    while ($row = $result->fetch_assoc()) {
        $especialidades[] = [
            'id'   => (int)$row['id'],
            'nome' => $row['nome']
        ];
    }
    jsonResponse(true, ['especialidades' => $especialidades]);
}

if ($action === 'especialidades.save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id   = isset($_POST['id']) && $_POST['id'] !== '' ? (int)$_POST['id'] : null;
    $nome = trim($_POST['nome'] ?? '');

    if ($nome === '') jsonResponse(false, ['error' => 'Nome da especialidade é obrigatório.'], 400);

    if ($id) {
        $stmt = $conn->prepare("UPDATE especialidades SET nome = ? WHERE id = ?");
        $stmt->bind_param("si", $nome, $id);
        $ok = $stmt->execute();
        $stmt->close();
    } else {
        $stmt = $conn->prepare("INSERT INTO especialidades (nome) VALUES (?)");
        $stmt->bind_param("s", $nome);
        $ok = $stmt->execute();
        $id = $stmt->insert_id;
        $stmt->close();
    }

    if (!$ok) jsonResponse(false, ['error' => $conn->error], 500);

    jsonResponse(true, ['especialidade' => ['id' => $id, 'nome' => $nome]]);
}

if ($action === 'especialidades.delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    if ($id <= 0) jsonResponse(false, ['error' => 'ID inválido.'], 400);

    $stmt = $conn->prepare("DELETE FROM especialidades WHERE id = ?");
    $stmt->bind_param("i", $id);
    $ok = $stmt->execute();
    $stmt->close();

    if (!$ok) jsonResponse(false, ['error' => $conn->error], 500);

    jsonResponse(true);
}

/* ===================== MÉDICOS ===================== */

if ($action === 'medicos.list') {
    $sql = "SELECT id, nome, especialidade_id, pacientes_hora FROM medicos ORDER BY id ASC";
    $result = $conn->query($sql);
    if (!$result) jsonResponse(false, ['error' => $conn->error], 500);

    $medicos = [];
    while ($row = $result->fetch_assoc()) {
        $medicos[] = [
            'id'              => (int)$row['id'],
            'nome'            => $row['nome'],
            'especialidadeId' => $row['especialidade_id'] !== null ? (int)$row['especialidade_id'] : null,
            'pacientesHora'   => (int)$row['pacientes_hora']
        ];
    }
    jsonResponse(true, ['medicos' => $medicos]);
}

if ($action === 'medicos.save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id              = isset($_POST['id']) && $_POST['id'] !== '' ? (int)$_POST['id'] : null;
    $nome            = trim($_POST['nome'] ?? '');
    $especialidadeId = isset($_POST['especialidadeId']) && $_POST['especialidadeId'] !== ''
        ? (int)$_POST['especialidadeId']
        : null;
    $pacientesHora   = isset($_POST['pacientesHora']) ? (int)$_POST['pacientesHora'] : 0;

    if ($nome === '') jsonResponse(false, ['error' => 'Nome do médico é obrigatório.'], 400);
    if ($pacientesHora <= 0) jsonResponse(false, ['error' => 'Pacientes por hora inválido.'], 400);

    if ($id) {
        $stmt = $conn->prepare("UPDATE medicos SET nome = ?, especialidade_id = ?, pacientes_hora = ? WHERE id = ?");
        $stmt->bind_param("siii", $nome, $especialidadeId, $pacientesHora, $id);
        $ok = $stmt->execute();
        $stmt->close();
    } else {
        $stmt = $conn->prepare("INSERT INTO medicos (nome, especialidade_id, pacientes_hora) VALUES (?, ?, ?)");
        $stmt->bind_param("sii", $nome, $especialidadeId, $pacientesHora);
        $ok = $stmt->execute();
        $id = $stmt->insert_id;
        $stmt->close();
    }

    if (!$ok) jsonResponse(false, ['error' => $conn->error], 500);

    jsonResponse(true, [
        'medico' => [
            'id'              => $id,
            'nome'            => $nome,
            'especialidadeId' => $especialidadeId,
            'pacientesHora'   => $pacientesHora
        ]
    ]);
}

if ($action === 'medicos.delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    if ($id <= 0) jsonResponse(false, ['error' => 'ID inválido.'], 400);

    $stmt = $conn->prepare("DELETE FROM medicos WHERE id = ?");
    $stmt->bind_param("i", $id);
    $ok = $stmt->execute();
    $stmt->close();

    if (!$ok) jsonResponse(false, ['error' => $conn->error], 500);

    jsonResponse(true);
}

/* ===================== AGENDA (SLOTS) ===================== */

if ($action === 'agenda.list') {
    $sql = "SELECT id, data, hora_inicio, hora_fim, sala_id, medico_id, obs
            FROM agenda_slots
            ORDER BY data ASC, hora_inicio ASC";
    $result = $conn->query($sql);
    if (!$result) jsonResponse(false, ['error' => $conn->error], 500);

    $slots = [];
    while ($row = $result->fetch_assoc()) {
        $slots[] = [
            'id'         => (int)$row['id'],
            'data'       => $row['data'], // yyyy-mm-dd
            'horaInicio' => substr($row['hora_inicio'], 0, 5),
            'horaFim'    => substr($row['hora_fim'], 0, 5),
            'salaId'     => (int)$row['sala_id'],
            'medicoId'   => $row['medico_id'] !== null ? (int)$row['medico_id'] : null,
            'obs'        => $row['obs'] ?? ''
        ];
    }
    jsonResponse(true, ['slots' => $slots]);
}

if ($action === 'agenda.save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id         = isset($_POST['id']) && $_POST['id'] !== '' ? (int)$_POST['id'] : null;
    $data       = trim($_POST['data'] ?? '');
    $horaInicio = trim($_POST['horaInicio'] ?? '');
    $horaFim    = trim($_POST['horaFim'] ?? '');
    $salaId     = isset($_POST['salaId']) ? (int)$_POST['salaId'] : 0;
    $medicoId   = isset($_POST['medicoId']) && $_POST['medicoId'] !== '' ? (int)$_POST['medicoId'] : null;
    $obs        = trim($_POST['obs'] ?? '');

    if ($data === '' || $horaInicio === '' || $horaFim === '' || $salaId <= 0) {
        jsonResponse(false, ['error' => 'Dados obrigatórios da agenda não informados.'], 400);
    }

    if ($id) {
        $stmt = $conn->prepare("UPDATE agenda_slots
                                SET data = ?, hora_inicio = ?, hora_fim = ?, sala_id = ?, medico_id = ?, obs = ?
                                WHERE id = ?");
        $stmt->bind_param("sssissi", $data, $horaInicio, $horaFim, $salaId, $medicoId, $obs, $id);
        $ok = $stmt->execute();
        $stmt->close();
    } else {
        $stmt = $conn->prepare("INSERT INTO agenda_slots
                                (data, hora_inicio, hora_fim, sala_id, medico_id, obs)
                                VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssiss", $data, $horaInicio, $horaFim, $salaId, $medicoId, $obs);
        $ok = $stmt->execute();
        $id = $stmt->insert_id;
        $stmt->close();
    }

    if (!$ok) jsonResponse(false, ['error' => $conn->error], 500);

    jsonResponse(true, [
        'slot' => [
            'id'         => $id,
            'data'       => $data,
            'horaInicio' => $horaInicio,
            'horaFim'    => $horaFim,
            'salaId'     => $salaId,
            'medicoId'   => $medicoId,
            'obs'        => $obs
        ]
    ]);
}

if ($action === 'agenda.delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    if ($id <= 0) jsonResponse(false, ['error' => 'ID inválido.'], 400);

    $stmt = $conn->prepare("DELETE FROM agenda_slots WHERE id = ?");
    $stmt->bind_param("i", $id);
    $ok = $stmt->execute();
    $stmt->close();

    if (!$ok) jsonResponse(false, ['error' => $conn->error], 500);

    jsonResponse(true);
}

/* ===================== CALL CENTER ===================== */

if ($action === 'call.list') {
    $sql = "SELECT id, data, profissional_id, disponibilizados, agendados, confirmados, atendidos
            FROM call_entries
            ORDER BY data ASC, id ASC";
    $result = $conn->query($sql);
    if (!$result) jsonResponse(false, ['error' => $conn->error], 500);

    $entries = [];
    while ($row = $result->fetch_assoc()) {
        $entries[] = [
            'id'              => (int)$row['id'],
            'data'            => $row['data'],
            'profissionalId'  => $row['profissional_id'] !== null ? (int)$row['profissional_id'] : null,
            'disponibilizados'=> (int)$row['disponibilizados'],
            'agendados'       => (int)$row['agendados'],
            'confirmados'     => (int)$row['confirmados'],
            'atendidos'       => (int)$row['atendidos']
        ];
    }
    jsonResponse(true, ['entries' => $entries]);
}

if ($action === 'call.save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id             = isset($_POST['id']) && $_POST['id'] !== '' ? (int)$_POST['id'] : null;
    $data           = trim($_POST['data'] ?? '');
    $profissionalId = isset($_POST['profissionalId']) && $_POST['profissionalId'] !== ''
        ? (int)$_POST['profissionalId']
        : null;
    $disp           = isset($_POST['disponibilizados']) ? (int)$_POST['disponibilizados'] : 0;
    $ag             = isset($_POST['agendados']) ? (int)$_POST['agendados'] : 0;
    $conf           = isset($_POST['confirmados']) ? (int)$_POST['confirmados'] : 0;
    $at             = isset($_POST['atendidos']) ? (int)$_POST['atendidos'] : 0;

    if ($data === '') jsonResponse(false, ['error' => 'Data é obrigatória.'], 400);

    if ($id) {
        $stmt = $conn->prepare("UPDATE call_entries
                                SET data = ?, profissional_id = ?, disponibilizados = ?, agendados = ?, confirmados = ?, atendidos = ?
                                WHERE id = ?");
        $stmt->bind_param("siiiiii", $data, $profissionalId, $disp, $ag, $conf, $at, $id);
        $ok = $stmt->execute();
        $stmt->close();
    } else {
        $stmt = $conn->prepare("INSERT INTO call_entries
                                (data, profissional_id, disponibilizados, agendados, confirmados, atendidos)
                                VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("siiiii", $data, $profissionalId, $disp, $ag, $conf, $at);
        $ok = $stmt->execute();
        $id = $stmt->insert_id;
        $stmt->close();
    }

    if (!$ok) jsonResponse(false, ['error' => $conn->error], 500);

    jsonResponse(true, [
        'entry' => [
            'id'              => $id,
            'data'            => $data,
            'profissionalId'  => $profissionalId,
            'disponibilizados'=> $disp,
            'agendados'       => $ag,
            'confirmados'     => $conf,
            'atendidos'       => $at
        ]
    ]);
}

if ($action === 'call.delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    if ($id <= 0) jsonResponse(false, ['error' => 'ID inválido.'], 400);

    $stmt = $conn->prepare("DELETE FROM call_entries WHERE id = ?");
    $stmt->bind_param("i", $id);
    $ok = $stmt->execute();
    $stmt->close();

    if (!$ok) jsonResponse(false, ['error' => $conn->error], 500);

    jsonResponse(true);
}

/* ===================== AÇÃO INVÁLIDA ===================== */

jsonResponse(false, ['error' => 'Ação inválida.'], 400);
