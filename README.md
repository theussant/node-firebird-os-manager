# 🛠️ Service Manager Web

![Badge Status](https://img.shields.io/badge/Status-Completed-success)
![Badge Node](https://img.shields.io/badge/Node.js-v18+-green)
![Badge Firebird](https://img.shields.io/badge/Database-FirebirdSQL-orange)
![Badge License](https://img.shields.io/badge/License-MIT-blue)

> **Modernização de Gestão de Ordens de Serviço:** Um sistema web Fullstack desenvolvido para integrar e modernizar fluxos de trabalho de assistências técnicas que utilizam bancos de dados legados (Firebird SQL).

## 🎯 Sobre o Projeto

Este projeto nasceu da necessidade de agilizar o atendimento em assistências técnicas. O objetivo foi criar uma interface web moderna, responsiva e ágil que consumisse dados diretamente de um ERP Desktop legado, sem necessidade de migração de dados complexa.

O sistema permite que técnicos gerenciem Ordens de Serviço (OS) em tempo real, coletem assinaturas digitais e evitem o uso do papel físico em meio aos atendimentos diários facilitando o dia a dia e agilizando os procedimentos padrões da empresa.

## ✨ Funcionalidades Principais

* **📊 Dashboard Interativo:** Visão geral de OS abertas, em andamento e concluídas com indicadores de performance.
* **📋 Kanban de Status:** Atualização de status (Novo → Andamento → Concluído) via *drag-and-drop* ou seleção rápida.
* **✍️ Assinatura Digital:** Captura de assinatura do cliente diretamente na tela (touch ou mouse) usando `signature_pad`.
* **🖨️ Impressão Inteligente:** Layout CSS otimizado para impressão térmica (cupom) e A4.
* **🔍 Busca Inteligente:** Pesquisa de clientes e OS otimizada para evitar erros de truncamento em bancos SQL antigos.

## 🛠️ Tecnologias Utilizadas

* **Backend:** Node.js, Express.js.
* **Frontend:** EJS (Server-side rendering), CSS3 Responsivo, JavaScript (ES6+).
* **Banco de Dados:** Firebird SQL (Integração direta com `node-firebird`).
* **Ferramentas:** `dotenv` (variáveis de ambiente), `signature_pad`.

## 📸 Screenshots

| Dashboard | Edição de OS |
| :---: | :---: |
| ![Dashboard](https://via.placeholder.com/400x200?text=Dashboard+Screenshot) | ![Formulário](https://via.placeholder.com/400x200?text=Formulario+OS) |

| Kanban | Assinatura Digital |
| :---: | :---: |
| ![Kanban](https://via.placeholder.com/400x200?text=Kanban+Flow) | ![Assinatura](https://via.placeholder.com/400x200?text=Signature+Pad) |

## 🚀 Como Rodar o Projeto

### Pré-requisitos

* [Node.js](https://nodejs.org/) instalado.
* Banco de dados Firebird (arquivo `.FDB`) ou use o script de criação abaixo.

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/SEU-USUARIO/service-manager-web.git](https://github.com/SEU-USUARIO/service-manager-web.git)
    cd service-manager-web
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
    ```env
    DB_HOST=127.0.0.1
    DB_PORT=3050
    DB_DATABASE=C:/Caminho/Para/Seu/Banco.FDB
    DB_USER=SYSDBA
    DB_PASSWORD=masterkey
    SESSION_SECRET=sua_chave_secreta_aqui
    PORT=3000
    ```

4.  **Prepare o Banco de Dados:**
    Se você não tiver o banco legado, execute o script SQL disponível em `database_schema.sql` para criar as tabelas necessárias.

5.  **Inicie o servidor:**
    ```bash
    npm start
    ```

6.  **Acesse:** Abra `http://localhost:3000` no seu navegador.

## 🗄️ Estrutura do Banco de Dados (Resumo)

O sistema foi modelado para interagir com as seguintes tabelas principais:

* `TB_OS`: Tabela central das Ordens de Serviço.
* `TB_CLIENTE`: Cadastro de clientes.
* `TB_OS_ITEM`: Peças e serviços vinculados à OS.
* `TB_OS_FOTO`: Armazenamento de fotos e assinaturas (BLOB).

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Desenvolvido por Matheus dos Santos**
[LinkedIn](https://www.linkedin.com/in/matheus-dos-santos-silva6/) | [GitHub](https://github.com/theussant)
