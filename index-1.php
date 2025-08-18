<?php
// API de Integração CCAPI Financiamentos
// Para ser usado por outros sites para consultar status de propostas

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Configuração do banco de dados
$host = 'localhost';
$dbname = 'ccapi_financiamentos';
$username = 'seu_usuario';
$password = 'sua_senha';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro de conexão com banco de dados']);
    exit;
}

// Roteamento da API
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = trim($path, '/');
$segments = explode('/', $path);

// Endpoints disponíveis
switch($method) {
    case 'GET':
        if ($segments[1] === 'propostas') {
            if (isset($segments[2])) {
                // GET /api/propostas/{id} - Buscar proposta específica
                buscarProposta($pdo, $segments[2]);
            } else {
                // GET /api/propostas - Listar todas as propostas
                listarPropostas($pdo);
            }
        } elseif ($segments[1] === 'especialista') {
            // GET /api/especialista/{nome} - Propostas por especialista
            listarPropostasPorEspecialista($pdo, $segments[2]);
        } elseif ($segments[1] === 'veiculo') {
            // GET /api/veiculo/{tipo} - Propostas por tipo de veículo
            listarPropostasPorVeiculo($pdo, $segments[2]);
        }
        break;
        
    case 'POST':
        if ($segments[1] === 'propostas') {
            // POST /api/propostas - Criar nova proposta
            criarProposta($pdo);
        } elseif ($segments[1] === 'usuarios') {
            // POST /api/usuarios - Criar novo usuário
            criarUsuario($pdo);
        }
        break;
        
    case 'PUT':
        if ($segments[1] === 'propostas' && isset($segments[2])) {
            // PUT /api/propostas/{id} - Atualizar status da proposta
            atualizarProposta($pdo, $segments[2]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        break;
}

// Função para buscar proposta específica
function buscarProposta($pdo, $id) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM vw_propostas_completas WHERE id = ? OR codigo_proposta = ?");
        $stmt->execute([$id, $id]);
        $proposta = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($proposta) {
            echo json_encode($proposta);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Proposta não encontrada']);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao buscar proposta']);
    }
}

// Função para listar todas as propostas
function listarPropostas($pdo) {
    try {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = ($page - 1) * $limit;
        
        $stmt = $pdo->prepare("SELECT * FROM vw_propostas_completas ORDER BY data_criacao DESC LIMIT ? OFFSET ?");
        $stmt->execute([$limit, $offset]);
        $propostas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Contar total
        $countStmt = $pdo->query("SELECT COUNT(*) FROM propostas");
        $total = $countStmt->fetchColumn();
        
        echo json_encode([
            'data' => $propostas,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao listar propostas']);
    }
}

// Função para listar propostas por especialista
function listarPropostasPorEspecialista($pdo, $especialista) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM vw_propostas_completas WHERE especialista = ? ORDER BY data_criacao DESC");
        $stmt->execute([$especialista]);
        $propostas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($propostas);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao buscar propostas do especialista']);
    }
}

// Função para listar propostas por tipo de veículo
function listarPropostasPorVeiculo($pdo, $tipo) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM vw_propostas_completas WHERE veiculo_tipo = ? ORDER BY data_criacao DESC");
        $stmt->execute([$tipo]);
        $propostas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($propostas);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao buscar propostas por tipo de veículo']);
    }
}

// Função para atualizar status da proposta
function atualizarProposta($pdo, $id) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['status'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Status é obrigatório']);
            return;
        }
        
        $stmt = $pdo->prepare("UPDATE propostas SET status = ?, data_atualizacao = NOW() WHERE id = ? OR codigo_proposta = ?");
        $stmt->execute([$input['status'], $id, $id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['message' => 'Proposta atualizada com sucesso']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Proposta não encontrada']);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao atualizar proposta']);
    }
}

// Função para criar nova proposta via API
function criarProposta($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validar campos obrigatórios
        $required_fields = ['usuario_id', 'cliente_nome', 'cliente_documento', 'veiculo_tipo', 'especialista'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Campo $field é obrigatório"]);
                return;
            }
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO propostas (
                usuario_id, cliente_nome, cliente_documento, cliente_telefone, cliente_email,
                cliente_profissao, cliente_renda_mensal, cliente_cep, cliente_endereco,
                veiculo_tipo, veiculo_marca, veiculo_modelo, veiculo_ano, veiculo_placa,
                veiculo_valor, veiculo_condicao, valor_financiar, valor_entrada,
                tipo_produto, especialista
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $input['usuario_id'], $input['cliente_nome'], $input['cliente_documento'],
            $input['cliente_telefone'], $input['cliente_email'], $input['cliente_profissao'],
            $input['cliente_renda_mensal'], $input['cliente_cep'], $input['cliente_endereco'],
            $input['veiculo_tipo'], $input['veiculo_marca'], $input['veiculo_modelo'],
            $input['veiculo_ano'], $input['veiculo_placa'], $input['veiculo_valor'],
            $input['veiculo_condicao'], $input['valor_financiar'], $input['valor_entrada'],
            $input['tipo_produto'], $input['especialista']
        ]);
        
        $proposta_id = $pdo->lastInsertId();
        
        echo json_encode([
            'message' => 'Proposta criada com sucesso',
            'id' => $proposta_id
        ]);
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao criar proposta: ' . $e->getMessage()]);
    }
}
?>
