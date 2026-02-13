/**
 * Database Connection & Seeding Test Script
 * --------------------------------------------------------------------------
 * Usage: node scripts/test-connection.js
 * * This utility verifies:
 * 1. Connectivity with the Firebird Database.
 * 2. Presence of registered users (Technicians).
 * 3. Integrity of password hashes (checks if they are legacy MD5 or plain text).
 */

require('dotenv').config(); // Load environment variables
const db = require('../config/db'); // Adjust path to config folder

const maskString = (str) => {
    if (!str) return '(EMPTY)';
    if (str.length <= 4) return '****';
    return str.substring(0, 4) + '...'; // Shows only first 4 chars
};

async function testDatabase() {
    console.log('\n🔄 Testing Database Connection...');
    console.time('Query Time');

    try {
        const sql = "SELECT ID_FUNCIONARIO, NOME, SENHA, ATIVO FROM TB_FUNCIONARIO";
        const users = await db.executeQuery(sql);

        console.timeEnd('Query Time');
        console.log(`✅ Connection Successful! Found ${users.length} users.\n`);

        // Prepare data for a clean console table
        const tableData = users.map(u => {
            const rawPassword = u.SENHA ? u.SENHA.trim() : '';
            const isMD5 = rawPassword.length === 32 && /^[0-9a-fA-F]+$/.test(rawPassword);

            return {
                ID: u.ID_FUNCIONARIO,
                Name: u.NOME.trim(),
                'Active?': u.ATIVO === 'S' ? 'Yes' : 'No',
                'Auth Type': isMD5 ? 'MD5 Hash' : 'Plain Text (Legacy)',
                'Password Preview': maskString(rawPassword) // Security masking
            };
        });

        console.table(tableData);
        console.log('\nSUCCESS: Database is ready for the application.\n');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ CRITICAL ERROR: Could not connect to database.');
        console.error(`Details: ${err.message}\n`);
        process.exit(1);
    }
}

testDatabase();