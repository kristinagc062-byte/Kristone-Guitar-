import type { Order } from '@/lib/order';

const ORDERS_HEADERS = [
  'Order ID',
  'Date',
  'Customer Name',
  'Phone Number',
  'Email',
  'Province',
  'District',
  'Municipality/City',
  'Full Address',
  'Product',
  'Quantity',
  'Unit Price',
  'Delivery Charge',
  'Total Amount',
  'Payment Method',
  'Order Status',
  'Notes',
];

const formattedSheets = new Set<string>();

const base64Url = (value:string|Uint8Array) => {
  const bytes = typeof value==='string' ? new TextEncoder().encode(value) : value;
  let binary=''; bytes.forEach(byte=>binary+=String.fromCharCode(byte));
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};

async function getAccessToken() {
  const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey=process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g,'\n');
  if(!email||!privateKey) throw new Error('Google Sheets credentials are not configured.');
  const pem=privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'');
  const der=Uint8Array.from(atob(pem),c=>c.charCodeAt(0));
  const key=await crypto.subtle.importKey('pkcs8',der,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const now=Math.floor(Date.now()/1000);
  const header=base64Url(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const claims=base64Url(JSON.stringify({iss:email,scope:'https://www.googleapis.com/auth/spreadsheets',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
  const unsigned=`${header}.${claims}`;
  const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(unsigned));
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${unsigned}.${base64Url(new Uint8Array(signature))}`})});
  const result=await response.json() as {access_token?:string;error_description?:string};
  if(!response.ok||!result.access_token) throw new Error(result.error_description||'Could not authenticate with Google Sheets.');
  return result.access_token;
}

async function getSpreadsheet(sheetId: string, token: string) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets(properties(sheetId,title,gridProperties(rowCount,columnCount)))`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) {
    throw new Error('Could not read the spreadsheet structure.');
  }
  return response.json() as Promise<{
    sheets?: Array<{
      properties?: {
        sheetId?: number;
        title?: string;
        gridProperties?: { rowCount?: number; columnCount?: number };
      };
    }>;
  }>;
}

async function ensureOrdersTab(sheetId: string, token: string) {
  const tab = process.env.GOOGLE_SHEET_TAB_NAME || 'Orders';
  const spreadsheet = await getSpreadsheet(sheetId, token);
  let sheet = spreadsheet.sheets?.find(entry => entry.properties?.title === tab);

  if (!sheet?.properties?.sheetId) {
    const createResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: tab } } }],
      }),
    });
    if (!createResponse.ok) {
      throw new Error(`Could not create the "${tab}" sheet tab.`);
    }
    const refreshed = await getSpreadsheet(sheetId, token);
    sheet = refreshed.sheets?.find(entry => entry.properties?.title === tab);
  }

  const sheetIdNumber = sheet?.properties?.sheetId;
  if (typeof sheetIdNumber !== 'number') {
    throw new Error(`The "${tab}" sheet tab could not be found.`);
  }

  if (!formattedSheets.has(`${sheetId}:${sheetIdNumber}`)) {
    const headerRange = `'${tab.replace(/'/g, "''")}'!A1:Q1`;
    const headerResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(headerRange)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!headerResponse.ok) {
      throw new Error('Could not inspect the spreadsheet header row.');
    }
    const headerData = await headerResponse.json() as { values?: string[][] };
    const firstRow = headerData.values?.[0] ?? [];
    const hasHeaders = ORDERS_HEADERS.every((header, index) => firstRow[index] === header);

    if (!hasHeaders) {
      const writeResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(headerRange)}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          majorDimension: 'ROWS',
          values: [ORDERS_HEADERS],
        }),
      });
      if (!writeResponse.ok) {
        throw new Error('Could not write the spreadsheet header row.');
      }
    }

    const formatResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetIdNumber,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: ORDERS_HEADERS.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.07, green: 0.07, blue: 0.06 },
                  horizontalAlignment: 'CENTER',
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 0.95, green: 0.83, blue: 0.47 },
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)',
            },
          },
          {
            updateSheetProperties: {
              properties: {
                sheetId: sheetIdNumber,
                gridProperties: { frozenRowCount: 1 },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: sheetIdNumber,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: ORDERS_HEADERS.length,
              },
            },
          },
        ],
      }),
    });
    if (!formatResponse.ok) {
      throw new Error('Could not style the Orders sheet.');
    }

    formattedSheets.add(`${sheetId}:${sheetIdNumber}`);
  }
}

export async function appendOrder(order:Order) {
  const sheetId=process.env.GOOGLE_SHEET_ID;
  const tab=process.env.GOOGLE_SHEET_TAB_NAME||'Orders';
  if(!sheetId) throw new Error('GOOGLE_SHEET_ID is not configured.');
  const token=await getAccessToken();
  await ensureOrdersTab(sheetId, token);
  const range=`'${tab.replace(/'/g,"''")}'!A:Q`;
  const response=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({values:[[order.orderId,order.dateTime,order.fullName,order.phone,order.email,order.province,order.district,order.municipality,order.fullAddress,order.productName,order.quantity,order.unitPrice,order.deliveryChargeLabel,order.totalAmountLabel,order.paymentMethod,order.orderStatus,order.notes||'']]})});
  if(!response.ok){ const message=await response.text(); console.error('Google Sheets append failed',response.status,message); throw new Error('The order could not be saved to Google Sheets.'); }
}
