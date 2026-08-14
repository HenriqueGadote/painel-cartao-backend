const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Colunas esperadas na aba (linha 1 = cabecalho, exatamente estes nomes):
// ID | Colaborador | Telefone | Cartao | Departamento | Fornecedor | Valor | DataCompra | PrazoDias | Observacao | Recebida | DataRecebimento

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
    recebida: String(row.get('Recebida') || '').trim().toUpperCase() === 'TRUE',
    dataRecebimento: row.get('DataRecebimento') || null,
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
    Recebida: 'FALSE',
    DataRecebimento: '',
  });
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
  marcarRecebida,
  removerPendencia,
};
