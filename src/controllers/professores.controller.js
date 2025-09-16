import { pool } from "../db.js";

/**
 * Tabelas:
 * professores: id, nome, email (UNIQUE), disciplina_id (FK disciplinas.id),
 *              titulacao (DEFAULT 'Graduado'), telefone,
 *              carga_horaria_semanal (DEFAULT 20), criado_em
 * disciplinas: id, nome, ativo, criado_em
 */

// GET /api/professores
export async function listarProfessores(req, res) {
  const [rows] = await pool.query(
    `SELECT p.id,
            p.nome,
            p.email,
            p.disciplina_id,
            d.nome AS disciplina_nome,
            p.titulacao,
            p.telefone,
            p.carga_horaria_semanal,
            p.criado_em
       FROM professores p
  LEFT JOIN disciplinas d ON d.id = p.disciplina_id
   ORDER BY p.id DESC`
  );
  res.json(rows);
}

// GET /api/professores/:id
export async function obterProfessor(req, res) {
  const { id } = req.params;
  const [rows] = await pool.query(
    `SELECT p.id,
            p.nome,
            p.email,
            p.disciplina_id,
            d.nome AS disciplina_nome,
            p.titulacao,
            p.telefone,
            p.carga_horaria_semanal,
            p.criado_em
       FROM professores p
  LEFT JOIN disciplinas d ON d.id = p.disciplina_id
      WHERE p.id = ?`,
    [id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ message: "Professor não encontrado" });
  }
  res.json(rows[0]);
}

// POST /api/professores
export async function criarProfessor(req, res) {
  const {
    nome,
    email,
    disciplina_id,
    titulacao = "Graduado",
    telefone = null,
    carga_horaria_semanal = 20,
  } = req.body;

  if (!nome || !email || disciplina_id === undefined || disciplina_id === null) {
    return res
      .status(400)
      .json({ message: "nome, email e disciplina_id são obrigatórios" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO professores
       (nome, email, disciplina_id, titulacao, telefone, carga_horaria_semanal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nome, email, disciplina_id, titulacao, telefone, carga_horaria_semanal]
    );

    // Opcional: trazer o nome da disciplina já na resposta
    const [[disc]] = await pool.query(
      "SELECT nome FROM disciplinas WHERE id = ?",
      [disciplina_id]
    );

    res.status(201).json({
      id: result.insertId,
      nome,
      email,
      disciplina_id,
      disciplina_nome: disc?.nome ?? null,
      titulacao,
      telefone,
      carga_horaria_semanal,
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email já cadastrado" });
    }
    // Erro de FK (disciplina inexistente)
    if (err.code === "ER_NO_REFERENCED_ROW_2" || err.code === "ER_NO_REFERENCED_ROW") {
      return res
        .status(422)
        .json({ message: "disciplina_id inexistente em disciplinas" });
    }
    console.error(err);
    res.status(500).json({ message: "Erro ao criar professor" });
  }
}

// PUT /api/professores/:id
export async function atualizarProfessor(req, res) {
  const { id } = req.params;
  const {
    nome,
    email,
    disciplina_id,
    titulacao,
    telefone,
    carga_horaria_semanal,
  } = req.body;

  const fields = [];
  const values = [];

  if (nome !== undefined) { fields.push("nome = ?"); values.push(nome); }
  if (email !== undefined) { fields.push("email = ?"); values.push(email); }
  if (disciplina_id !== undefined) { fields.push("disciplina_id = ?"); values.push(disciplina_id); }
  if (titulacao !== undefined) { fields.push("titulacao = ?"); values.push(titulacao); }
  if (telefone !== undefined) { fields.push("telefone = ?"); values.push(telefone); }
  if (carga_horaria_semanal !== undefined) {
    fields.push("carga_horaria_semanal = ?");
    values.push(carga_horaria_semanal);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "Nenhum campo para atualizar" });
  }

  values.push(id);

  try {
    const [result] = await pool.query(
      `UPDATE professores SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Professor não encontrado" });
    }
    res.json({ message: "Atualizado com sucesso" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email já cadastrado" });
    }
    if (err.code === "ER_NO_REFERENCED_ROW_2" || err.code === "ER_NO_REFERENCED_ROW") {
      return res
        .status(422)
        .json({ message: "disciplina_id inexistente em disciplinas" });
    }
    console.error(err);
    res.status(500).json({ message: "Erro ao atualizar professor" });
  }
}

// DELETE /api/professores/:id
export async function excluirProfessor(req, res) {
  const { id } = req.params;
  const [result] = await pool.query("DELETE FROM professores WHERE id = ?", [id]);
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: "Professor não encontrado" });
  }
  res.json({ message: "Excluído com sucesso" });
}
