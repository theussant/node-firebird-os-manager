/**
 * Script para CRIAR o arquivo database.fdb do zero.
 * Executar: node scripts/setup.js
 */
require('dotenv').config();
const Firebird = require('node-firebird');
const fs = require('fs');
const path = require('path');

const options = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3050,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER || 'SYSDBA',
    password: process.env.DB_PASSWORD || 'masterkey',
    pageSize: 4096
};

console.log("\n--- 🛠️ INICIANDO SETUP DO BANCO DE DADOS ---");

// 1. Criar o arquivo binário .FDB
Firebird.create(options, function(err, db) {
    if (err) {
        console.error("❌ Erro ao criar arquivo .FDB:", err.message);
        return;
    }

    console.log("✅ Arquivo .FDB criado com sucesso.");

    // 2. Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '../database/database_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // 3. Limpar o SQL (remover comentários e quebras de linha excessivas)
    const commands = sqlContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comentários /* ... */
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 5); // Ignora linhas vazias ou curtas demais

    console.log(`🚀 Executando ${commands.length} comandos SQL...`);

    // 4. Execução sequencial (um por um) para evitar "Table Unknown"
    async function executeSequentially(index) {
        if (index >= commands.length) {
            console.log("\n✨ BANCO DE DADOS PRONTO PARA USO!");
            db.detach();
            process.exit(0);
            return;
        }

        const cmd = commands[index];
        
        // Ignora comandos que o driver node-firebird as vezes falha em processar via query comum
        if (cmd.toUpperCase().startsWith('COMMIT') || cmd.toUpperCase().startsWith('SET GENERATOR')) {
            return executeSequentially(index + 1);
        }

        db.query(cmd, [], (err) => {
            if (err) {
                console.warn(`\n⚠️ Aviso no comando ${index}: ${err.message.split('\n')[0]}`);
            } else {
                process.stdout.write("."); 
            }
            
            // Pequeno intervalo para o Firebird registrar os metadados
            setTimeout(() => executeSequentially(index + 1), 100);
        });
    }

    executeSequentially(0);
});