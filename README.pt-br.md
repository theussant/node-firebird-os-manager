# 🛠️ Service Manager Web

**Português** | [English](./README.md) | [Español](./README.es.md)

![Badge Status](https://img.shields.io/badge/Status-Concluído-success)
![Badge Node](https://img.shields.io/badge/Node.js-v18+-green)
![Badge Firebird](https://img.shields.io/badge/Banco_de_Dados-FirebirdSQL-orange)
![Badge License](https://img.shields.io/badge/Licença-MIT-blue)

> **Modernizando a Gestão de Ordens de Serviço:** Uma aplicação web Fullstack desenvolvida para integrar e modernizar fluxos de trabalho de centros de suporte técnico que utilizam bancos de dados legados (Firebird SQL).

## 🎯 Sobre o Projeto

Este projeto nasceu da necessidade de agilizar o atendimento em ambientes de assistência técnica. O objetivo principal foi criar uma interface web moderna, responsiva e ágil que consome dados diretamente de um ERP Desktop legado, sem a necessidade de migrações complexas de dados.

O sistema permite que técnicos gerenciem Ordens de Serviço (OS) em tempo real, coletem assinaturas digitais e eliminem o uso de papel físico nas operações diárias, facilitando a rotina e acelerando os procedimentos padrão da empresa.

## ✨ Principais Funcionalidades

* **📊 Dashboard Interativo:** Visão geral de OS novas, em andamento e concluídas com indicadores de desempenho em tempo real.
* **📋 Fluxo de Trabalho Moderno:** Atualizações rápidas de status (Nova → Em Andamento → Concluída) através de uma interface limpa e focada no técnico.
* **✍️ Assinatura Digital:** Captura de assinaturas diretamente na tela (touch ou mouse) usando `signature_pad`.
* **🖨️ Impressão Inteligente:** Layout CSS otimizado tanto para impressoras térmicas (cupom) quanto para impressão em papel A4 padrão.
* **🔍 Busca Otimizada:** Pesquisa inteligente de clientes e OS projetada para lidar com as restrições do banco de dados legado de forma eficiente.

## 🛠️ Tecnologias Utilizadas

* **Backend:** Node.js, Express.js.
* **Frontend:** EJS (Server-side rendering), CSS3 Responsivo, JavaScript (ES6+).
* **Banco de Dados:** Firebird SQL (Integração direta via `node-firebird`).
* **Ferramentas:** `dotenv` (variáveis de ambiente), `express-session` (autenticação).

## 📸 Screenshots

| Dashboard | Editor de OS |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/9bf82179-53c5-44db-83ce-3b4fcf974111" width="400"> | <img src="https://github.com/user-attachments/assets/7fec92ac-73a2-4c5d-ae22-ca274ed741b4" width="400"> |

| Fluxo Kanban | Assinatura Digital |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/ee7f9aab-adb0-4c16-ad36-2acb867d4e51" width="400"> | <img src="https://github.com/user-attachments/assets/bbb76887-f5d6-4208-9ddf-79fe4a65b225" width="400"> |

## 🚀 Como Começar

### Pré-requisitos

* [Node.js](https://nodejs.org/) instalado (v18 ou superior).
* Engine do Firebird instalada (ou acesso a um arquivo `.FDB`).

### Instalação

1. **Clone e configure o projeto:**

   ```bash
   # Clonar o repositório
   git clone [https://github.com/theussant/service-manager-web.git](https://github.com/theussant/service-manager-web.git)
   cd service-manager-web

   # Instalar dependências
   npm install

   # Configurar ambiente (Copie o .env.example para .env e preencha suas credenciais)
   cp .env.example .env

   # Iniciar a aplicação
   npm start