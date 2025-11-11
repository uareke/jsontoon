// /**
//  * @file main.js
//  * Ponto de entrada principal da aplicação.
//  * Orquestra a UI (index.html) e a lógica de negócio (toonProcessor.js).
//  */

/**
 * @file main.js (v4.0)
 * Ponto de entrada principal da aplicação.
 * Orquestra a UI (index.html) e a lógica de negócio (toonRelationalProcessor.js).
 */

// Importa as funções do NOVO plugin relacional
import { 
    parseToonDocument, 
    stringifyToonDocument 
} from './toonRelationalProcessor.js';

function main() {
    // --- Seleção dos Elementos do DOM ---
    const toonInput = document.getElementById('toonInput');
    const parseButton = document.getElementById('parseButton');
    const jsOutput = document.getElementById('jsOutput');

    const jsInput = document.getElementById('jsInput');
    const objectNameInput = document.getElementById('objectName');
    const stringifyButton = document.getElementById('stringifyButton');
    const toonOutput = document.getElementById('toonOutput');

    // --- Adição de Event Listeners ---

    /**
     * Parsear (TOON Document -> JS)
     */
    parseButton.addEventListener('click', () => {
        try {
            const toonString = toonInput.value;
            // Usa a nova função de parse de DOCUMENTO
            const parsedData = parseToonDocument(toonString); 

            if (parsedData) {
                jsOutput.textContent = JSON.stringify(parsedData, null, 2);
            } else {
                jsOutput.textContent = 'Erro: Formato TOON de Documento inválido.';
            }
        } catch (error) {
            jsOutput.textContent = `Erro inesperado: ${error.message}`;
        }
    });

    /**
     * Converter (JS -> TOON Document)
     */
    stringifyButton.addEventListener('click', () => {
        try {
            const jsString = jsInput.value;
            const rootName = objectNameInput.value || 'data';
            const dataArray = JSON.parse(jsString);

            if (!Array.isArray(dataArray)) {
                 toonOutput.textContent = 'Erro: A entrada deve ser um Array JSON.';
                 return;
            }

            // Usa a nova função de stringify de DOCUMENTO
            const toonString = stringifyToonDocument(dataArray, rootName);

            if (toonString) {
                toonOutput.textContent = toonString;
            } else {
                toonOutput.textContent = 'Erro: Falha ao converter dados.';
            }

        } catch (jsonError) {
            toonOutput.textContent = `Erro: JSON de entrada inválido.\n${jsonError.message}`;
        }
    });
}

document.addEventListener('DOMContentLoaded', main);