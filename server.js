require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {
  listarPendenciasJSON,
  criarPendencia,
  atualizarPendencia,
  marcarRecebida,
  marcarConciliadoRodopar,
  removerPendencia,
} = require('./lib/sheets');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function checarTokenPainel(req, res, next) {
  const token = req.headers['x-panel-token'];
  if (!process.env.PANEL_TOKEN || token !== process.env.PANEL_TOKEN) {
    return res.status(401).json({ erro: 'token invalido' });
  }
  next();
}

app.get('/', (req, res) => {
  res.json({
    servico: 'TSA - Painel de pendencias de NF (cartao corporativo)',
    status: 'no ar',
  });
});

app.get('/api/pendencias', checarTokenPainel, async (req, res) => {
  try {
    const lista = await listarPendenciasJSON();
    res.json(lista);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.post('/api/pendencias', checarTokenPainel, async (req, res) => {
  try {
    const nova = await criarPendencia(req.body || {});
    res.status(201).json(nova);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.put('/api/pendencias/:id', checarTokenPainel, async (req, res) => {
  try {
    const atualizado = await atualizarPendencia(req.params.id, req.body || {});
    if (!atualizado) return res.status(404).json({ erro: 'registro nao encontrado' });
    res.json(atualizado);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.post('/api/pendencias/:id/receber', checarTokenPainel, async (req, res) => {
  try {
    const atualizado = await marcarRecebida(req.params.id);
    if (!atualizado) return res.status(404).json({ erro: 'registro nao encontrado' });
    res.json(atualizado);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.post('/api/pendencias/:id/rodopar', checarTokenPainel, async (req, res) => {
  try {
    const atualizado = await marcarConciliadoRodopar(req.params.id);
    if (!atualizado) return res.status(404).json({ erro: 'registro nao encontrado' });
    res.json(atualizado);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.delete('/api/pendencias/:id', checarTokenPainel, async (req, res) => {
  try {
    const ok = await removerPendencia(req.params.id);
    if (!ok) return res.status(404).json({ erro: 'registro nao encontrado' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servico do painel no ar na porta ${PORT}`);
});
