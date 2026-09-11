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

async function getDoc() {
  const creds = getCredentials();
  const jwt = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: SCOPES,
  });
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, jwt);
  await doc.loadInfo();
  return doc;
}

async function getSheet() {
  const doc = await getDoc();
  const tabName = process.env.GOOGLE_SHEET_TAB || 'Pendencias';
  const sheet = doc.sheetsByTitle[tabName];
  if (!sheet) {
    throw new Error(`Aba "${tabName}" nao encontrada na planilha. Confira GOOGLE_SHEET_TAB.`);
  }
  return sheet;
}

async function getLimitesSheet() {
  const doc = await getDoc();
  const tabName = 'Limites';
  let sheet = doc.sheetsByTitle[tabName];
  if (!sheet) {
    sheet = await doc.addSheet({ title: tabName, headerValues: ['Cartao', 'Limite'] });
  }
  return sheet;
}

async function listarLimites() {
