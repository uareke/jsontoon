/**
 * @file toonRelationalProcessor.js
 * (v4.0 - Relacional)
 * * Um processador TOON de Documento, inovador e em vanilla JS.
 * Ele lida com dados relacionais (arrays aninhados) ao 
 * serializar/desserializar múltiplas tabelas relacionadas 
 * em um único documento TOON.
 * * @exports stringifyToonDocument - Converte um array JS com 
 * arrays aninhados em um documento string TOON.
 * @exports parseToonDocument - Converte um documento string TOON 
 * de volta para um array JS aninhado.
 */

// --- Helpers de "Flattening" (Modificados da v3.0) ---
// Estes helpers agora são "inteligentes" e ignoram arrays.

/**
 * (Helper v4.0) Achata um objeto, mas IGNORA chaves que são arrays.
 * Ex: { a: 1, b: { c: 2 }, d: [...] } -> ['a', 'b.c']
 */
const flattenObjectKeys = (obj, prefix = '') => {
  let keys = [];
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      continue; // PULA ARRAYS!
    }
    
    if (typeof value === 'object' && value !== null) {
      keys = keys.concat(flattenObjectKeys(value, newKey));
    } else {
      keys.push(newKey);
    }
  }
  return keys;
};

/**
 * (Helper v3.0) Obtém um valor aninhado de um objeto.
 */
const getFlatValue = (obj, flatKey) => {
  const keys = flatKey.split('.');
  return keys.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : null, obj);
};

/**
 * (Helper v3.0) Define um valor aninhado em um objeto.
 */
const setNestedValue = (obj, flatKey, value) => {
  const keys = flatKey.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
};


// --- API PÚBLICA (v4.0 - Relacional) ---

/**
 * Converte um array de objetos (com arrays aninhados) 
 * em um documento string TOON relacional.
 *
 * @param {Array<Object>} dataArray - O array de dados raiz (ex: [cliente1, cliente2]).
 * @param {string} rootName - O nome da tabela raiz (ex: "clientes").
 * @returns {string} O documento TOON completo.
 */
export const stringifyToonDocument = (dataArray, rootName) => {
  if (!dataArray || dataArray.length === 0) return `${rootName}[0]{}:`;

  const docParts = [];
  const rootObjSchema = dataArray[0];

  // 1. Descobrir o Esquema: O que é plano e o que é array?
  const arrayKeys = [];
  const scalarKeys = flattenObjectKeys(rootObjSchema); // Ex: ['id', 'nome', 'endereco.rua']
  
  for (const key in rootObjSchema) {
    if (Array.isArray(rootObjSchema[key])) {
      arrayKeys.push(key); // Ex: ['pedidos']
    }
  }
  
  // 2. Stringify da Tabela Raiz (ex: "clientes")
  const rootHeader = `${rootName}[${dataArray.length}]{${scalarKeys.join(',')}}:`;
  const rootRows = dataArray.map(obj => {
    return scalarKeys.map(key => getFlatValue(obj, key)).join(',');
  }).join('.\n');
  
  docParts.push(`${rootHeader}\n${rootRows}.`);

  // 3. Stringify das Tabelas Filhas (ex: "pedidos")
  // Assume que a chave de relação é 'id' no objeto pai.
  const parentKeyName = rootName.slice(0, -1) + '_id'; // "clientes" -> "cliente_id"

  for (const parentObj of dataArray) {
    const parentId = parentObj.id; // Assume que o pai tem 'id'
    if (parentId === undefined) continue;

    for (const arrayKey of arrayKeys) { // ex: 'pedidos'
      const childArray = parentObj[arrayKey];
      if (!childArray || childArray.length === 0) continue;

      const childSchema = Object.keys(childArray[0]); // Pega chaves do primeiro filho
      
      // Cabeçalho relacional: pedidos(cliente_id:1)[2]{id,Vendedor}
      const childHeader = `${arrayKey}(${parentKeyName}:${parentId})[${childArray.length}]{${childSchema.join(',')}}:`;
      
      const childRows = childArray.map(childObj => {
        return childSchema.map(key => childObj[key]).join(',');
      }).join('.\n');

      docParts.push(`${childHeader}\n${childRows}.`);
    }
  }

  // Junta todos os blocos de tabela (raiz + filhos)
  return docParts.join('\n\n'); // Separa tabelas com linha dupla
};


/**
 * (Helper v4.0) Sub-função que re-utiliza a lógica de parse do v3.0.
 * Converte um bloco de linhas de dados em um array de objetos.
 */
const parseTableData = (flatKeys, dataRows) => {
  return dataRows
    .split('\n')
    .filter(row => row.trim() !== '')
    .map(row => {
      const cleanRow = row.trim().endsWith('.') 
        ? row.trim().slice(0, -1) 
        : row.trim();
        
      const values = cleanRow.split(',');
      const newObj = {};
      
      flatKeys.forEach((key, index) => {
        const val = (values[index] === undefined) ? null : values[index].trim();
        setNestedValue(newObj, key, val);
      });
      return newObj;
    });
};

/**
 * Converte um documento string TOON (com múltiplas tabelas)
 * de volta para um array de objetos aninhados (hidratado).
 *
 * @param {string} toonDocument - O documento TOON completo.
 * @returns {Array<Object>|null} O array de dados raiz reconstruído.
 */
export const parseToonDocument = (toonDocument) => {
  try {
    const tables = {};
    const rootData = [];
    
    // 1. Regex Mágica (Global): Encontra CADA bloco de tabela no documento
    const tableRegex = /([a-zA-Z0-9_]+)(\([^)]+\))?\[\d+\]\{([^}]+)\}:\s*([\s\S]*?)(?=\n\n[a-zA-Z0-9_]+|$)/g;
    
    let match;
    while ((match = tableRegex.exec(toonDocument)) !== null) {
      const name = match[1]; // ex: "clientes" ou "pedidos"
      const relationStr = match[2]; // ex: "(cliente_id:1)" ou undefined
      const keys = match[3].split(',').map(k => k.trim()); // ex: ['id', 'nome']
      const rows = match[4].trim(); // O bloco de dados
      
      const parsedData = parseTableData(keys, rows);

      if (!relationStr) {
        // É a Tabela Raiz (ex: "clientes")
        rootData.push(...parsedData);
        tables[name] = rootData; // Armazena os dados raiz
      } else {
        // É uma Tabela Filha (Relacional)
        // Parse da Relação: (cliente_id:1)
        const relMatch = relationStr.match(/\(([^:]+):(.+)\)/);
        if (!relMatch) continue;
        
        // const relationKey = relMatch[1]; // "cliente_id" (Não estamos usando agora)
        const parentId = relMatch[2]; // "1" (como string)

        // Encontra o objeto pai no array raiz
        const parentObject = rootData.find(p => p.id == parentId);
        
        if (parentObject) {
          // Hidrata o pai! Anexa o array de filhos.
          if (!parentObject[name]) {
            parentObject[name] = []; // Cria o array se não existir
          }
          parentObject[name].push(...parsedData);
        }
      }
    }
    
    return rootData;

  } catch (error) {
    console.error("Falha ao parsear Documento TOON:", error);
    return null;
  }
};