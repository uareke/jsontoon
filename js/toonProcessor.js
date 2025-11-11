/**
 * @file toonProcessor.js
 * Um plugin vanilla JS (v2.0) para parsing e stringifying (simplificados)
 * do formato TOON, com suporte a objetos aninhados (flattening).
 *
 * @exports parseToonTable - Converte string TOON tabular para Array de Objetos.
 * @exports stringifyToonTable - Converte Array de Objetos para string TOON tabular.
 */

// --- Funções Helper (Privadas ao Módulo) ---

/**
 * (Helper) Percorre um objeto e "achata" suas chaves usando notação de ponto.
 * Ex: { a: 1, b: { c: 2 } } -> ['a', 'b.c']
 * @param {object} obj - O objeto para achatar
 * @param {string} [prefix=''] - Usado para recursão
 * @returns {string[]} - Um array de chaves achatadas
 */
const getFlatKeys = (obj, prefix = '') => {
  let keys = [];
  for (const key in obj) {
    // Garante que a chave pertence ao objeto e não ao seu prototype
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      // Se for um objeto, mas não um array ou null, continue recursivamente
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys = keys.concat(getFlatKeys(value, newKey));
      } else {
        keys.push(newKey);
      }
    }
  }
  return keys;
};

/**
 * (Helper) Obtém um valor aninhado de um objeto usando uma chave "achatada".
 * Ex: getNestedValue(obj, 'endereco.rua')
 * @param {object} obj - O objeto fonte
 * @param {string} flatKey - A chave em notação de ponto (ex: 'a.b.c')
 * @returns {*} - O valor encontrado ou null
 */
const getNestedValue = (obj, flatKey) => {
  const keys = flatKey.split('.');
  // Usamos reduce para navegar profundamente no objeto
  return keys.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : null, obj);
};

/**
 * (Helper) Define um valor aninhado em um objeto usando uma chave "achatada".
 * Ex: setNestedValue(obj, 'endereco.rua', 'Rua X')
 * @param {object} obj - O objeto para modificar (mutação!)
 * @param {string} flatKey - A chave em notação de ponto (ex: 'a.b.c')
 * @param {*} value - O valor a ser definido
 */
const setNestedValue = (obj, flatKey, value) => {
  const keys = flatKey.split('.');
  let current = obj;

  // Itera até a penúltima chave para criar a estrutura
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    // Cria o objeto aninhado se ele não existir
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  // Define o valor na última chave
  current[keys[keys.length - 1]] = value;
};


// --- Funções Públicas (Exportadas) ---

/**
 * Converte uma string tabular TOON (agora com suporte a chaves aninhadas)
 * em um array de objetos JavaScript.
 *
 * @param {string} toonString - A string de dados no formato TOON.
 * @returns {{name: string, data: Array<Object>}|null}
 */
export const parseToonTable = (toonString) => {
  try {
    const trimmedString = toonString.trim();
    const regex = /^([a-zA-Z0-9_]+)\[\d+\]\{([^}]+)\}:\s*([\s\S]*)$/;
    const matches = trimmedString.match(regex);

    if (!matches) {
      console.error("Formato TOON inválido ou não tabular.");
      return null;
    }

    const objectName = matches[1];
    const flatKeys = matches[2].split(',').map(k => k.trim());
    const dataRows = matches[3].trim(); // Contém todas as linhas de dados

    // --- INÍCIO DA CORREÇÃO (v3.0) ---

    // 1. Quebra o bloco de dados em linhas individuais usando a nova linha.
    //    Isso é crucial e era a fonte do bug.
    const rows = dataRows
      .split('\n')
      .filter(row => row.trim() !== ''); // Remove linhas vazias

    // 2. Mapeia cada linha (que agora está correta)
    const data = rows.map(row => {
      // 3. Limpa a linha: remove espaços e o '.' final
      //    (Ex: " 1,Alice,admin. " -> "1,Alice,admin")
      const cleanRow = row.trim().endsWith('.') 
        ? row.trim().slice(0, -1) 
        : row.trim();

      // 4. SÓ AGORA quebramos os valores pela vírgula (,)
      const values = cleanRow.split(',');

      // 5. Constrói o objeto (lógica v2.1)
      const newObj = {};
      flatKeys.forEach((key, index) => {
        const rawValue = values[index];
        let val;

        if (rawValue === undefined) {
          val = null; // A linha tem menos colunas que o cabeçalho
        } else {
          val = rawValue.trim();
        }
        
        setNestedValue(newObj, key, val);
      });

      return newObj;
    });

    // --- FIM DA CORREÇÃO ---

    return {
      name: objectName,
      data: data
    };

  } catch (error) {
    console.error("Falha ao parsear TOON:", error);
    return null;
  }
};


/**
 * Converte um array de objetos JavaScript (com estrutura uniforme,
 * agora com suporte a objetos aninhados) para o formato tabular TOON.
 *
 * @param {Array<Object>} dataArray - O array de objetos para converter.
 * @param {string} objectName - O nome a ser usado no cabeçalho TOON.
 * @returns {string|null}
 */
export const stringifyToonTable = (dataArray, objectName = 'data') => {
  try {
    if (!dataArray || dataArray.length === 0) {
      console.warn("Array de dados está vazio.");
      return `${objectName}[0]{}:`;
    }

    // 1. A mágica acontece aqui: usamos o helper para pegar chaves aninhadas
    const flatKeys = getFlatKeys(dataArray[0]);

    // 2. Criar o cabeçalho
    const header = `${objectName}[${dataArray.length}]{${flatKeys.join(',')}}:`;

    // 3. Criar as linhas de dados
    const dataRows = dataArray.map(obj => {
      // Mapeia os valores usando o helper para buscar valores aninhados
      const values = flatKeys.map(key => getNestedValue(obj, key));
      return values.join(',');
    });

    return `${header}\n${dataRows.join('.\n')}.`;

  } catch (error) {
    console.error("Falha ao stringify para TOON:", error);
    return null;
  }
};