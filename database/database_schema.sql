/******************************************************************************/
/* SERVICE MANAGER WEB - DATABASE SCHEMA (FIREBIRD SQL)                       */
/* -------------------------------------------------------------------------- */
/* This script creates the necessary table structure and populates the        */
/* database with initial seed data for testing purposes.                      */
/******************************************************************************/

/* --- 1. GENERATORS (SEQUENCES) -------------------------------------------- */

CREATE GENERATOR GEN_OS_ID;
CREATE GENERATOR GEN_CLIENTE_ID;
CREATE GENERATOR GEN_ITEM_ID;

/* --- 2. CORE TABLES ------------------------------------------------------- */

/* Technicians / System Users */
CREATE TABLE TB_FUNCIONARIO (
    ID_FUNCIONARIO INTEGER NOT NULL PRIMARY KEY,
    NOME           VARCHAR(60),
    SENHA          VARCHAR(20),
    ATIVO          CHAR(1) DEFAULT 'S'
);

/* Clients Registry */
CREATE TABLE TB_CLIENTE (
    ID_CLIENTE     INTEGER NOT NULL PRIMARY KEY,
    NOME           VARCHAR(100),
    FONE_CELUL     VARCHAR(20),
    FONE_COMER     VARCHAR(20),
    FONE_RESID     VARCHAR(20),
    END_LOGRAD     VARCHAR(100),
    END_NUMERO     VARCHAR(20),
    END_BAIRRO     VARCHAR(60),
    END_CEP        VARCHAR(15),
    END_COMPLE     VARCHAR(60),
    EMAIL_NFE      VARCHAR(100),
    EMAIL_CONT     VARCHAR(100)
);

/* Corporate Clients (Extra Info) */
CREATE TABLE TB_CLI_PJ (
    ID_CLIENTE     INTEGER NOT NULL PRIMARY KEY,
    CNPJ           VARCHAR(20),
    NOME_FANTA     VARCHAR(100),
    INSC_ESTAD     VARCHAR(20)
);

/* Products and Services Inventory */
CREATE TABLE TB_ESTOQUE (
    ID_ESTOQUE     INTEGER NOT NULL PRIMARY KEY,
    DESCRICAO      VARCHAR(100),
    PRC_VENDA      NUMERIC(15,2),
    TIPO           CHAR(1) /* P=Product, S=Service */
);

/* --- 3. SERVICE ORDER CONFIGURATION --------------------------------------- */

/* Workflow Status */
CREATE TABLE TB_OS_STATUS (
    ID_STATUS      INTEGER NOT NULL PRIMARY KEY,
    DESCRICAO      VARCHAR(40)
);

/* Equipment Types (e.g., Laptop, Smartphone) */
CREATE TABLE TB_OS_OBJETO (
    ID_OBJETO      INTEGER NOT NULL PRIMARY KEY,
    DESCRICAO      VARCHAR(60)
);

/* --- 4. MAIN TRANSACTIONAL TABLES ----------------------------------------- */

/* Service Order Header */
CREATE TABLE TB_OS (
    ID_OS           INTEGER NOT NULL PRIMARY KEY,
    ID_CLIENTE      INTEGER REFERENCES TB_CLIENTE(ID_CLIENTE),
    ID_TECNICO_RESP INTEGER REFERENCES TB_FUNCIONARIO(ID_FUNCIONARIO),
    ID_STATUS       INTEGER REFERENCES TB_OS_STATUS(ID_STATUS),
    DT_OS           DATE DEFAULT CURRENT_DATE,
    HR_OS           TIME DEFAULT CURRENT_TIME,
    DT_FECHADO      DATE,
    OBSERVACAO      BLOB SUB_TYPE 1, /* Text Blob */
    COMPRADOR       VARCHAR(60)      /* Contact Person */
);

/* Equipment Details per OS */
CREATE TABLE TB_OS_OBJETO_OS (
    ID_OS           INTEGER NOT NULL REFERENCES TB_OS(ID_OS),
    ID_OBJETO       INTEGER REFERENCES TB_OS_OBJETO(ID_OBJETO),
    IDENT1          VARCHAR(100), /* Brand/Model */
    DEFEITO         BLOB SUB_TYPE 1, /* Reported Issue */
    PRIMARY KEY (ID_OS)
);

/* Items (Parts & Services) used in the OS */
CREATE TABLE TB_OS_ITEM (
    ID_ITEMOS       INTEGER NOT NULL PRIMARY KEY,
    ID_OS           INTEGER REFERENCES TB_OS(ID_OS),
    ID_IDENTIFICADOR INTEGER REFERENCES TB_ESTOQUE(ID_ESTOQUE),
    ID_FUNCIONARIO  INTEGER,
    QTD_ITEM        NUMERIC(15,3),
    VLR_UNIT        NUMERIC(15,2),
    VLR_TOTAL       NUMERIC(15,2),
    VLR_DESC        NUMERIC(15,2),
    ITEM_CANCEL     CHAR(1) DEFAULT 'N',
    ALIQUOTA        NUMERIC(15,2),
    POR_COMISSAO    NUMERIC(15,2)
);

/* Attachments (Photos & Digital Signatures) */
CREATE TABLE TB_OS_FOTO (
    ID_FOTO         INTEGER NOT NULL PRIMARY KEY,
    ID_OS           INTEGER REFERENCES TB_OS(ID_OS),
    DESCRICAO       VARCHAR(100),
    FOTO            BLOB SUB_TYPE 0 /* Binary Image Blob */
);

/* --- 5. DATA SEEDING (INITIAL DATA) --------------------------------------- */

/* Standard Status Codes (Critical for Kanban Logic) */
INSERT INTO TB_OS_STATUS (ID_STATUS, DESCRICAO) VALUES (23, 'NEW / PENDING');
INSERT INTO TB_OS_STATUS (ID_STATUS, DESCRICAO) VALUES (21, 'IN PROGRESS');
INSERT INTO TB_OS_STATUS (ID_STATUS, DESCRICAO) VALUES (22, 'COMPLETED');
INSERT INTO TB_OS_STATUS (ID_STATUS, DESCRICAO) VALUES (9,  'CLOSED');
INSERT INTO TB_OS_STATUS (ID_STATUS, DESCRICAO) VALUES (16, 'CANCELED');

/* Default Admin User */
INSERT INTO TB_FUNCIONARIO (ID_FUNCIONARIO, NOME, SENHA, ATIVO) 
VALUES (1, 'Admin Tech', '1234', 'S');

/* Sample Client */
INSERT INTO TB_CLIENTE (ID_CLIENTE, NOME, FONE_CELUL, END_BAIRRO) 
VALUES (100, 'John Doe Enterprises', '(55) 99999-9999', 'Downtown');

/* Sample Products/Services */
INSERT INTO TB_ESTOQUE (ID_ESTOQUE, DESCRICAO, PRC_VENDA, TIPO) 
VALUES (1, 'Technical Labor (Hour)', 150.00, 'S');

INSERT INTO TB_ESTOQUE (ID_ESTOQUE, DESCRICAO, PRC_VENDA, TIPO) 
VALUES (2, 'SSD 480GB SATA', 250.00, 'P');

/* Equipment Type */
INSERT INTO TB_OS_OBJETO (ID_OBJETO, DESCRICAO) VALUES (1, 'Notebook');

/* Initial Service Order (Demo) */
INSERT INTO TB_OS (ID_OS, ID_CLIENTE, ID_TECNICO_RESP, ID_STATUS, DT_OS, OBSERVACAO, COMPRADOR) 
VALUES (1001, 100, 1, 23, '2023-10-01', 'System running slow, blue screen errors.', 'Mr. John');

INSERT INTO TB_OS_OBJETO_OS (ID_OS, ID_OBJETO, IDENT1, DEFEITO)
VALUES (1001, 1, 'Dell Latitude 5400', 'BSOD when opening heavy apps');

/* Set Generators to avoid conflict with seeded IDs */
SET GENERATOR GEN_OS_ID TO 1002;
SET GENERATOR GEN_CLIENTE_ID TO 101;

COMMIT WORK;