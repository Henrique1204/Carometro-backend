const { query } = require('../../../db/consultas.js');
const moverArquivo = require('../../../util/moverArquivo.js');
const { unlink } = require('fs');

module.exports = async (req, res) => {
    let foto;

    try {
        const { nome, email, telefone, id_turma } = req.body;
        foto = req.file?.path.replace('\\', '/');
        const { id } = req.params;

        if (!nome || !email || !telefone || !foto || !id_turma) {
            const erro = { cod: 400, mensagem: 'Dados incompletos!' };
            throw new Error(JSON.stringify(erro));
        }

        if (isNaN(id_turma) || isNaN(id)) {
            const erro = { cod: 406, mensagem: "Dados inválidos!" };
            throw new Error(JSON.stringify(erro));
        }

        const sqlFoto = `SELECT foto, email FROM alunos WHERE id = ${id}`;
        const resFoto = await query(sqlFoto, 'alunos', 'select');
        if (!resFoto.ok) throw new Error(JSON.stringify(resFoto.resposta));

        if (resFoto.resposta.length === 0) {
            const erro = { cod: 404, mensagem: 'Aluno informado não existe.' };
            throw new Error(JSON.stringify(erro));
        }

        const sqlEmail = `SELECT * FROM alunos WHERE email = '${email}'`;
        const resEmail = await query(sqlEmail, 'alunos', 'select');
        if (!resEmail.ok) throw new Error(JSON.stringify(resEmail.resposta));

        if (resEmail.resposta.length !== 0 && resFoto.resposta[0].email !== email) {
            const erro = { cod: 422, mensagem: 'E-mail pertence a outro aluno.' };
            throw new Error(JSON.stringify(erro));
        }

        const sqlTurma = (
            `SELECT t.nome FROM alunos INNER JOIN turmas as t 
            ON alunos.id_turma = t.id WHERE id_turma = ${id_turma}`
        );

        const resTurma = await query(sqlTurma, 'turmas', 'select');
        if (!resTurma.ok) throw new Error(JSON.stringify(resTurma.resposta));

        const arquivo = await moverArquivo(resTurma.resposta[0].nome, foto);
        foto = arquivo.foto;

        const sqlUpdate = (
            `UPDATE alunos SET nome = '${nome}', email = '${email}', telefone = '${telefone}', 
            foto = '${foto}', id_turma = '${id_turma}' WHERE id = ${id}`
        );

        const resUpdate = await query(sqlUpdate, 'alunos', 'insert');
        if (!resUpdate.ok) throw new Error(JSON.stringify(resUpdate.resposta));

        unlink(resFoto.resposta[0].foto, () => {});
        return res.status(201).send(resUpdate.resposta);
    } catch ({ message }) {
        unlink(foto, () => {});
        const { cod, mensagem, erroSQL } = JSON.parse(message);

        if (erroSQL) return res.status(cod).send({ status: 'Falha', mensagem, erroSQL });
        else return res.status(cod).send({ status: 'Falha', mensagem });
    }
};
