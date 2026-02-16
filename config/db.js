require('dotenv').config();
const Firebird = require('node-firebird');
const path = require('path');

// Resolve o caminho do banco de dados de forma inteligente
const getDatabasePath = () => {
    const envPath = process.env.DB_DATABASE;
    
    // Se não houver nada no .env, usa o padrão na pasta database
    if (!envPath) {
        return path.join(__dirname, '../database/database.fdb');
    }

    // Se o caminho no .env for absoluto (ex: C:/... ou /home/...), usa ele direto
    if (path.isAbsolute(envPath)) {
        return envPath;
    }

    // Se for relativo (ex: "database/database.fdb"), resolve a partir da RAIZ do projeto
    return path.resolve(process.cwd(), envPath);
};

const options = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3050,
    database: getDatabasePath(), // Agora o caminho é dinâmico e seguro
    user: process.env.DB_USER || 'SYSDBA',
    password: process.env.DB_PASSWORD || 'masterkey',
    lowercase_keys: false,
    role: null,
    pageSize: 4096
};

/**
 * Helper: Converts Firebird Stream/BLOB fields into Buffers.
 * The driver returns BLOBs as functions (streams) that must be consumed asynchronously.
 */
const fetchBlobs = async (rows) => {
    if (!Array.isArray(rows)) return rows;

    for (const row of rows) {
        for (const key in row) {
            const value = row[key];
            
            // Detects if the column is a Stream (BLOB)
            if (typeof value === 'function') {
                try {
                    row[key] = await new Promise((resolve, reject) => {
                        value((err, name, eventEmitter) => {
                            if (err) return reject(err);
                            
                            const chunks = [];
                            eventEmitter.on('data', chunk => chunks.push(chunk));
                            eventEmitter.on('end', () => resolve(Buffer.concat(chunks)));
                            eventEmitter.on('error', reject);
                        });
                    });
                } catch (error) {
                    console.error(`[DB] Failed to process BLOB for column ${key}:`, error.message);
                    row[key] = null;
                }
            }
        }
    }
    return rows;
};

/**
 * Executes a SQL query managing the connection lifecycle (attach -> query -> detach).
 * @param {string} query - SQL statement
 * @param {Array} params - Binding parameters for security
 */
const executeQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        Firebird.attach(options, (err, db) => {
            if (err) return reject(err);

            db.query(query, params, async (err, result) => {
                if (err) {
                    db.detach();
                    return reject(err);
                }

                try {
                    // Must process streams before detaching the connection
                    const processedResult = await fetchBlobs(result);
                    db.detach();
                    resolve(processedResult);
                } catch (processError) {
                    db.detach();
                    reject(processError);
                }
            });
        });
    });
};

module.exports = { executeQuery };