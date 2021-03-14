const { update } = require('../../db/consultas.js');

module.exports = async (req, res) => {
    try {
        const { nome } = req.body;
        const { id } = req.params;

        if (!nome || !id) {
            const erro = JSON.stringify({ cod: 400, mensagem: 'Dados incompletos!' });
            throw new Error(erro);
        }

        const consulta = `UPDATE turmas SET nome = '${nome}' WHERE id = ${id}`;
    
        const { ok, resposta } = await update(consulta, 'turmas', id);

        if (!ok) throw new Error(JSON.stringify(resposta));

        res.status(201).send(resposta);
    } catch ({ message }) {
        const { cod, mensagem, erroSQL } = JSON.parse(message);

        if (erroSQL) res.status(cod).send({ status: 'Falha', mensagem, erroSQL });
        else res.status(cod).send({ status: 'Falha', mensagem });
    }
};
