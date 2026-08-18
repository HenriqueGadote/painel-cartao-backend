const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON nao configurado no .env');
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON invalido - confira se o JSON esta em uma linha so, sem quebras.');
  }
}

async function getSheet() {
  const creds = getCredentials();
  const jwt = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: SCOPES,
  });

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, jwt);
  await doc.loadInfo();

  const tabName = process.env.GOOGLE_SHEET_TAB || 'Pendencias';
  const sheet = doc.sheetsByTitle[tabName];
  if (!sheet) {
    throw new Error(`Aba "${tabName}" nao encontrada na planilha. Confira GOOGLE_SHEET_TAB.`);
  }
  return sheet;
}

async function listarPendencias() {
  const sheet = await getSheet();
  const rows = await sheet.getRows();
  return rows;
}

function rowParaJSON(row) {
  return {
    id: row.get('ID'),
    colaborador: row.get('Colaborador') || '',
    telefone: row.get('Telefone') || '',
    empresa: row.get('Cartao') || '',
    departamento: row.get('Departamento') || '',
    fornecedor: row.get('Fornecedor') || '',
    valor: Number(row.get('Valor')) || 0,
    data: row.get('DataCompra') || '',
    prazo: Number(row.get('PrazoDias')) || 3,
    obs: row.get('Observacao') || '',
    temFrete: String(row.get('Frete') || '').trim().toUpperCase() === 'TRUE',
    valorFrete: Number(row.get('ValorFrete')) || 0,
    parcelado: String(row.get('Parcelado') || '').trim().toUpperCase() === 'TRUE',
    parcelas: Number(row.get('Parcelas')) || 0,
    fatura: row.get('Fatura') || '',
    numeroNF: row.get('NumeroNF') || '',
    recebida: String(row.get('Recebida') || '').trim().toUpperCase() === 'TRUE',
    dataRecebimento: row.get('DataRecebimento') || null,
    conciliadoRodopar: String(row.get('ConciliadoRodopar') || '').trim().toUpperCase() === 'TRUE',
    dataConciliacao: row.get('DataConciliacao') || null,
  };
}

async function listarPendenciasJSON() {
  const rows = await listarPendencias();
  return rows.map(rowParaJSON);
}

function gerarId() {
  return 'p_' + Math.random().toString(36).slice(2, 10);
}

async function criarPendencia(payload) {
  const sheet = await getSheet();
  const id = gerarId();
  const row = await sheet.addRow({
    ID: id,
    Colaborador: payload.colaborador || '',
    Telefone: payload.telefone || '',
    Cartao: payload.empresa || '',
    Departamento: payload.departamento || '',
    Fornecedor: payload.fornecedor || '',
    Valor: payload.valor || 0,
    DataCompra: payload.data || '',
    PrazoDias: payload.prazo || 3,
    Observacao: payload.obs || '',
    Frete: payload.temFrete ? 'TRUE' : 'FALSE',
    ValorFrete: payload.valorFrete || 0,
    Parcelado: payload.parcelado ? 'TRUE' : 'FALSE',
    Parcelas: payload.parcelas || 0,
    Fatura: payload.fatura || '',
    NumeroNF: payload.numeroNF || '',
    Recebida: 'FALSE',
    DataRecebimento: '',
    ConciliadoRodopar: 'FALSE',
    DataConciliacao: '',
  });
  return rowParaJSON(row);
}

async function atualizarPendencia(id, payload) {
  const rows = await listarPendencias();
  const row = rows.find((r) => r.get('ID') === id);
  if (!row) return null;

  if (payload.colaborador !== undefined) row.set('Colaborador', payload.colaborador);
  if (payload.telefone !== undefined) row.set('Telefone', payload.telefone);
  if (payload.empresa !== undefined) row.set('Cartao', payload.empresa);
  if (payload.departamento !== undefined) row.set('Departamento', payload.departamento);
  if (payload.fornecedor !== undefined) row.set('Fornecedor', payload.fornecedor);
  if (payload.valor !== undefined) row.set('Valor', payload.valor);
  if (payload.data !== undefined) row.set('DataCompra', payload.data);
  if (payload.prazo !== undefined) row.set('PrazoDias', payload.prazo);
  if (payload.obs !== undefined) row.set('Observacao', payload.obs);
  if (payload.temFrete !== undefined) row.set('Frete', payload.temFrete ? 'TRUE' : 'FALSE');
  if (payload.valorFrete !== undefined) row.set('ValorFrete', payload.valorFrete);
  if (payload.parcelado !== undefined) row.set('Parcelado', payload.parcelado ? 'TRUE' : 'FALSE');
  if (payload.parcelas !== undefined) row.set('Parcelas', payload.parcelas);
  if (payload.fatura !== undefined) row.set('Fatura', payload.fatura);
  if (payload.numeroNF !== undefined) row.set('NumeroNF', payload.numeroNF);

  await row.save();
  return rowParaJSON(row);
}

async function marcarRecebida(id) {
  const rows = await listarPendencias();
  const row = rows.find((r) => r.get('ID') === id);
  if (!row) return null;
  row.set('Recebida', 'TRUE');
  row.set('DataRecebimento', new Date().toISOString().slice(0, 10));
  await row.save();
  return rowParaJSON(row);
}

async function marcarConciliadoRodopar(id) {
  const rows = await listarPendencias();
  const row = rows.find((r) => r.get('ID') === id);
  if (!row) return null;
  row.set('ConciliadoRodopar', 'TRUE');
  row.set('DataConciliacao', new Date().toISOString().slice(0, 10));
  await row.save();
  return rowParaJSON(row);
}

async function removerPendencia(id) {
  const rows = await listarPendencias();
  const row = rows.find((r) => r.get('ID') === id);
  if (!row) return false;
  await row.delete();
  return true;
}

module.exports = {
  getSheet,
  listarPendencias,
  listarPendenciasJSON,
  criarPendencia,
  atualizarPendencia,
  marcarRecebida,
  marcarConciliadoRodopar,
  removerPendencia,
};
