<?php
$host = "localhost";
$usuario = "u380360322_agendamedica";
$senha = "Miguel847829";
$banco = "u380360322_agendamedica";

$conn = new mysqli($host, $usuario, $senha, $banco);

if ($conn->connect_error) {
    die("Erro na conexão: " . $conn->connect_error);
}

$conn->set_charset("utf8");
?>
