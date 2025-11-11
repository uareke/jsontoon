# 🚀 Processador TOON Relacional (v4.0)

Este não é só "mais um parser". É uma maquininha de economizar grana.

## 🧐 Tá, mas... que diabos é TOON?

Senta aí. A moda agora é **TOON (Token-Oriented Object Notation)**.

O JSON é ótimo, mas ele é "verboso". Ele repete as chaves sem parar.

------------------------------------------------------------------------

## JSON (O Gastador 💸)

``` json
[
  { "id": 1, "nome": "Zezinho", "idade": 10 },
  { "id": 2, "nome": "Huguinho", "idade": 11 },
  { "id": 3, "nome": "Luizinho", "idade": 12 }
]
```

Olha quanto lixo repetido: `id`, `nome`, `idade`... **3x!**\
Isso são tokens preciosos indo pro ralo.

------------------------------------------------------------------------

## TOON (O Mão-de-Vaca Inteligente 🧠)

``` toon
usuarios[3]{id,nome,idade}:
1,Zezinho,10.
2,Huguinho,11.
3,Luizinho,12.
```

Boom! 🤯\
A gente declara o "esquema" (as chaves) **UMA vez** e depois só manda os
dados puros, separados por vírgula.\
A economia de tokens é brutal.

------------------------------------------------------------------------

## 🔥 O Pulo do Gato: E os Arrays Aninhados?

Beleza, converter um array "plano" (flat) é fácil.

Mas e quando você tem dados do mundo real? Tipo, um cliente que tem
vários pedidos?

### Exemplo JSON

``` json
{
  "id": 1,
  "cliente": "João Silva",
  "pedidos": [
    { "id_pedido": 101, "item": "Pizza" },
    { "id_pedido": 102, "item": "Refri" }
  ],
  "endereco": {
    "rua": "Rua X",
    "cidade": "Sampa"
  }
}
```

Como diabos você transforma o array `pedidos` em TOON sem quebrar o
parser com um monte de vírgulas extras?

> **É AÍ QUE ESSE PLUGIN (v4.0) BRILHA.**

A gente não "achata" os arrays. Isso seria burro e criaria um cabeçalho
instável (`pedidos.0.item`, `pedidos.1.item`... que nojo).

Nós tratamos seu JSON como **um banco de dados relacional**.\
Esse plugin é inteligente o suficiente para:

✅ Criar uma tabela `clientes` (com `id`, `cliente` e `endereco.cidade`
achatado).\
✅ Criar uma segunda tabela `pedidos`, linkada ao cliente pelo ID (tipo
uma *foreign key*).

------------------------------------------------------------------------

## 🤘 Como usar essa mágica?

Nosso cérebro é o arquivo **`toonRelationalProcessor.js`**.\
Ele exporta duas funções:

------------------------------------------------------------------------

### 1) Convertendo JSON para TOON --- `stringifyToonDocument`

Recebe seu array de objetos (incluindo arrays aninhados) e retorna um
documento TOON relacional.

#### Entrada

``` js
const meusClientes = [
  {
    "id": 1,
    "nome": "João Silva",
    "pedidos": [
      { "id_pedido": 101, "item": "Pizza" },
      { "id_pedido": 102, "item": "Refri" }
    ],
    "endereco": { "cidade": "São Paulo" }
  },
  {
    "id": 2,
    "nome": "Maria Oliveira",
    "pedidos": [ { "id_pedido": 201, "item": "Salada" } ],
    "endereco": { "cidade": "Rio de Janeiro" }
  }
];
```

#### Código

``` js
import { stringifyToonDocument } from './toonRelationalProcessor.js';

// 'clientes' será o nome da tabela raiz
const toonMaroto = stringifyToonDocument(meusClientes, 'clientes');
console.log(toonMaroto);
```

#### Saída

``` toon
clientes[2]{id,nome,endereco.cidade}:
1,João Silva,São Paulo.
2,Maria Oliveira,Rio de Janeiro.

pedidos(cliente_id:1)[2]{id_pedido,item}:
101,Pizza.
102,Refri.

pedidos(cliente_id:2)[1]{id_pedido,item}:
201,Salada.
```

------------------------------------------------------------------------

### 2) Lendo TOON de volta pro JS --- `parseToonDocument`

Faz o caminho inverso: lê um documento TOON com múltiplas tabelas,
entende as relações (`cliente_id:1`) e reconstrói o JSON original.

#### Código

``` js
import { parseToonDocument } from './toonRelationalProcessor.js';

const stringToon = "... (aquele stringão TOON ali de cima) ...";

const jsDeVolta = parseToonDocument(stringToon);

// 'jsDeVolta' é IDÊNTICO ao seu array 'meusClientes' original.
console.log(jsDeVolta);
```

------------------------------------------------------------------------

## 📁 Estrutura de Arquivos

    index.html               → UI para colar seu JSON e converter
    main.js                  → Controlador da UI
    toonRelationalProcessor.js → O cérebro (plugin v4.0)

> 100% Vanilla JS --- sem framework, sem frescura.

------------------------------------------------------------------------

## 🏃 Como rodar isso?

> ⚠️ Importante: você **não** pode abrir `index.html` diretamente (tipo
> `file:///...`).\
> Como usamos módulos ES (`import/export`), o navegador bloqueia se não
> vier de um servidor.

### Com VS Code --- o jeito mais fácil

1.  Instale a extensão **Live Server** (Ritwick Dey)
2.  Clique com o botão direito em `index.html`
3.  Selecione **Open with Live Server**
4.  Pronto! Abriu no navegador (ex: `http://127.0.0.1:5500`)

------------------------------------------------------------------------

## É isso!

Agora vai lá e **economiza uns tokens!**\
**Falou! 🤙**
