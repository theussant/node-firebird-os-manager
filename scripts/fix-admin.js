require('dotenv').config();
const db = require('../config/db');

async function fixAdmin() {
    console.log("--- 🔧 REPARANDO USUÁRIO ADMIN ---");
    try {
        
        const sql = "UPDATE TB_FUNCIONARIO SET ATIVO = 'S', NOME = 'Admin Tech' WHERE ID_FUNCIONARIO = 1";
        await db.executeQuery(sql);
        
        console.log("✅ Usuário ID 1 atualizado para ATIVO = 'S'");

       
        const check = await db.executeQuery("SELECT ID_FUNCIONARIO, NOME, ATIVO FROM TB_FUNCIONARIO WHERE ID_FUNCIONARIO = 1");
        console.table(check);

        console.log("\n🚀logar novamente com 'Admin Tech' e '1234'");
        process.exit(0);
    } catch (err) {
        console.error("❌ Erro ao reparar:", err.message);
        process.exit(1);
    }
}

fixAdmin();