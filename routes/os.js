/**
 * Service Orders (OS) Controller
 * --------------------------------------------------------------------------
 * Core business logic for managing Service Orders.
 * Includes:
 * - CRUD operations with legacy database compatibility.
 * - Kanban status workflow management.
 * - Binary data handling (Photos & Digital Signatures).
 * - Advanced search with string truncation protection.
 */

const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Adjusted path to config

// --- UTILS: Legacy Blob Handling ---

/**
 * Converts binary buffers (Latin1) to readable UTF-8/String.
 * Essential for legacy Firebird fields (VARCHAR OCTETS).
 */
const bufferToString = (blob) => {
    if (!blob) return '';
    if (Buffer.isBuffer(blob)) return blob.toString('latin1');
    return String(blob);
};

/**
 * Reads a Firebird Blob Stream and converts it to a Buffer.
 * Wraps the stream event emitters in a Promise.
 */
const readBlob = (blob) => {
    return new Promise((resolve) => {
        if (!blob) return resolve(null);
        if (Buffer.isBuffer(blob)) return resolve(blob);
        
        if (typeof blob === 'function') {
            blob((err, name, eventEmitter) => {
                if (err) return resolve(null);
                let chunks = [];
                eventEmitter.on('data', (chunk) => chunks.push(chunk));
                eventEmitter.on('end', () => resolve(Buffer.concat(chunks)));
                eventEmitter.on('error', () => resolve(null));
            });
        } else {
            try { return resolve(Buffer.from(blob)); } catch (e) { return resolve(null); }
        }
    });
};

// --- CONSTANTS: Workflow Status IDs ---
// These map directly to the TB_OS_STATUS table in the database
const WORKFLOW_STATUS = {
    NEW: 23,        // Pending review
    IN_PROGRESS: 21,
    COMPLETED: 22,  // Waiting for customer pickup
    CLOSED: 9,      // Finalized/Archived
    CANCELED: 16
};

// =========================================================================
// API: KANBAN WORKFLOW (Status Updates)
// =========================================================================
router.post('/atualizar-status', async (req, res) => {
    const { id_os, novo_status } = req.body;

    if (!id_os || !novo_status) return res.status(400).send("Invalid parameters.");

    try {
        // 1. Guard Clause: Check if OS is already Closed (Immutable state)
        const check = await db.executeQuery("SELECT ID_STATUS FROM TB_OS WHERE ID_OS = ?", [id_os]);
        if (check.length > 0 && check[0].ID_STATUS === WORKFLOW_STATUS.CLOSED) {
            return res.status(403).json({ error: "Operation denied: Closed tickets cannot be modified." });
        }

        // 2. Determine new status ID
        let targetStatusId = 0;
        let closingDate = null;

        // Map textual/numeric inputs to standardized IDs
        switch (String(novo_status).toLowerCase()) {
            case 'novo': case '23': targetStatusId = WORKFLOW_STATUS.NEW; break;
            case 'andamento': case '21': targetStatusId = WORKFLOW_STATUS.IN_PROGRESS; break;
            case 'concluido': case '22': targetStatusId = WORKFLOW_STATUS.COMPLETED; break;
            case 'fechado': case '9': 
                targetStatusId = WORKFLOW_STATUS.CLOSED; 
                closingDate = new Date(); 
                break;
            default: 
                targetStatusId = parseInt(novo_status) || WORKFLOW_STATUS.NEW;
        }

        // 3. Execute Update
        if (targetStatusId === WORKFLOW_STATUS.CLOSED) {
            await db.executeQuery("UPDATE TB_OS SET ID_STATUS = ?, DT_FECHADO = ? WHERE ID_OS = ?", [targetStatusId, closingDate, id_os]);
        } else {
            await db.executeQuery("UPDATE TB_OS SET ID_STATUS = ? WHERE ID_OS = ?", [targetStatusId, id_os]);
        }

        res.json({ success: true, newStatusId: targetStatusId });

    } catch (err) {
        console.error("[Kanban Error]:", err.message);
        res.status(500).send("Database error updating status.");
    }
});

// =========================================================================
// API: AUTOCOMPLETE ENDPOINTS
// =========================================================================

router.get("/api/clientes", async (req, res) => {
    try {
        // Truncate input to 30 chars to prevent SQL string truncation errors
        const term = String(req.query.q || '').substring(0, 30);
        if (term.length < 2) return res.json([]);
        
        const sql = `SELECT FIRST 10 NOME FROM TB_CLIENTE WHERE UPPER(NOME) CONTAINING UPPER(?) ORDER BY NOME ASC`;
        const result = await db.executeQuery(sql, [term]);
        res.json(result.map(c => c.NOME));
    } catch (e) { res.json([]); }
});

router.get("/api/produto/:id", async (req, res) => {
    try {
        const sql = `SELECT FIRST 1 CAST(DESCRICAO AS VARCHAR(100) CHARACTER SET OCTETS) AS D, PRC_VENDA FROM TB_ESTOQUE WHERE ID_ESTOQUE = ?`;
        const r = await db.executeQuery(sql, [req.params.id]);
        
        if (r.length > 0) {
            res.json({ 
                found: true, 
                descricao: bufferToString(r[0].D), 
                preco: parseFloat(r[0].PRC_VENDA || 0) 
            });
        } else {
            res.json({ found: false });
        }
    } catch (e) { res.json({ found: false }); }
});

router.get("/api/produtos", async (req, res) => {
    try {
        const term = String(req.query.q || '').substring(0, 30);
        let sql = `SELECT FIRST 50 ID_ESTOQUE, CAST(DESCRICAO AS VARCHAR(100) CHARACTER SET OCTETS) AS D, PRC_VENDA FROM TB_ESTOQUE`;
        let params = [];
        
        if (term) { 
            sql += ` WHERE UPPER(DESCRICAO) CONTAINING UPPER(?) OR CAST(ID_ESTOQUE AS VARCHAR(20)) = ?`; 
            params = [term, term]; 
        }
        
        const r = await db.executeQuery(sql, params);
        res.json(r.map(x => ({ 
            id: x.ID_ESTOQUE, 
            nome: bufferToString(x.D), 
            preco: parseFloat(x.PRC_VENDA || 0) 
        })));
    } catch (e) { res.json([]); }
});

// =========================================================================
// VIEW: LIST SERVICE ORDERS
// =========================================================================
router.get("/", async (req, res) => {
    let { page = 1, status, search, date } = req.query;
    page = parseInt(page);
    const limit = 20;
    const offset = (page - 1) * limit;

    if (!req.session.user) return res.redirect('/auth/login');
    const technicianId = req.session.user.ID_TECNICO;

    try {
        // Build dynamic WHERE clause
        let whereClauses = ["O.ID_TECNICO_RESP = ?"];
        let params = [technicianId];

        if (status) {
            let s = parseInt(status);
            // Map legacy IDs if passed via query
            if (s === 1) s = WORKFLOW_STATUS.NEW;
            if (s === 2) s = WORKFLOW_STATUS.IN_PROGRESS;
            if (s === 3) s = WORKFLOW_STATUS.COMPLETED;
            if (s === 9) s = WORKFLOW_STATUS.CLOSED;
            
            whereClauses.push("O.ID_STATUS = ?");
            params.push(s);
        }

        if (date) { 
            whereClauses.push("O.DT_OS = ?"); 
            params.push(date); 
        }
        
        // Advanced Search (Name, OS ID, or Tax ID/CNPJ)
        if (search) {
            // Security: Aggressive truncation to avoid "String Truncation -303" Firebird error
            const term = String(search).trim().substring(0, 30);
            const nums = term.replace(/[^0-9]/g, '');
            
            let conds = [];
            let pars = [];

            // Case-insensitive name search
            conds.push("UPPER(C.NOME) CONTAINING UPPER(CAST(? AS VARCHAR(30)))"); 
            pars.push(term);

            // OS ID Search
            conds.push("CAST(O.ID_OS AS VARCHAR(30)) CONTAINING ?"); 
            pars.push(term);

            // CNPJ Search (only if numeric input exists)
            if (nums.length > 0) { 
                conds.push("PJ.CNPJ CONTAINING ?"); 
                pars.push(nums); 
            }
            
            whereClauses.push(`(${conds.join(" OR ")})`);
            params.push(...pars);
        }

        const whereSQL = "WHERE " + whereClauses.join(" AND ");

        // Main Query with Joins
        const sql = `
            SELECT FIRST ${limit} SKIP ${offset}
                O.ID_OS, O.ID_CLIENTE, O.DT_OS, O.ID_STATUS, 
                C.NOME AS NOME_CLIENTE, 
                CAST(OBJ.DESCRICAO AS VARCHAR(100) CHARACTER SET OCTETS) AS TIPO_EQUIPAMENTO,
                CAST(OSO.IDENT1 AS VARCHAR(100) CHARACTER SET OCTETS) AS MARCA_MODELO,
                CAST(OSO.DEFEITO AS VARCHAR(300) CHARACTER SET OCTETS) AS DEFEITO_EQUIPAMENTO,
                PJ.CNPJ,
                CASE 
                    WHEN O.ID_STATUS = ${WORKFLOW_STATUS.NEW} THEN 'novo'
                    WHEN O.ID_STATUS = ${WORKFLOW_STATUS.IN_PROGRESS} THEN 'andamento'
                    WHEN O.ID_STATUS = ${WORKFLOW_STATUS.COMPLETED} THEN 'concluido'
                    WHEN O.ID_STATUS = ${WORKFLOW_STATUS.CLOSED} THEN 'fechado'
                    ELSE 'outros'
                END as STATUS_TEXTO
            FROM TB_OS O
            INNER JOIN TB_CLIENTE C ON O.ID_CLIENTE = C.ID_CLIENTE
            LEFT JOIN TB_OS_OBJETO_OS OSO ON O.ID_OS = OSO.ID_OS
            LEFT JOIN TB_OS_OBJETO OBJ ON OSO.ID_OBJETO = OBJ.ID_OBJETO
            LEFT JOIN TB_CLI_PJ PJ ON C.ID_CLIENTE = PJ.ID_CLIENTE
            ${whereSQL}
            ORDER BY O.ID_OS DESC
        `;
        
        const raw = await db.executeQuery(sql, params);
        
        // Data Transformation for View
        const osList = raw.map(os => ({
            ...os,
            TITULO_EQUIPAMENTO: (bufferToString(os.TIPO_EQUIPAMENTO) || "Serviço") + " " + (bufferToString(os.MARCA_MODELO) || ""),
            RESUMO_DEFEITO: bufferToString(os.DEFEITO_EQUIPAMENTO),
            NOME_REAL_CLIENTE: os.NOME_CLIENTE,
            CNPJ: os.CNPJ
        }));

        res.render("os/list", { 
            osList, 
            page, 
            totalPages: 1, // Pagination logic simplified for portfolio
            user: req.session.user, 
            currentPage: 'os',
            filtroStatus: status || '', 
            filtroSearch: search || '', 
            filtroDate: date || ''
        });

    } catch (err) {
        console.error("[OS List Error]:", err.message);
        res.render("os/list", { 
            osList: [], page: 1, totalPages: 1, error: "Search failed: " + err.message, 
            user: req.session.user, currentPage: 'os',
            filtroStatus: status || '', filtroSearch: search || '', filtroDate: date || ''
        });
    }
});

// =========================================================================
// VIEW: EDIT FORM (GET)
// =========================================================================
router.get("/edit/:id", async (req, res) => {
    try {
        const idOs = req.params.id;
        
        // Fetch OS Details
        const sql = `
            SELECT O.ID_OS, O.ID_CLIENTE, O.ID_TECNICO_RESP, O.DT_OS, O.HR_OS, O.ID_STATUS,
                   CAST(O.OBSERVACAO AS VARCHAR(8000) CHARACTER SET OCTETS) AS OBSERVACAO,
                   C.NOME AS NOME_CLIENTE, C.FONE_CELUL, C.END_LOGRAD, C.END_NUMERO, C.END_BAIRRO,
                   TB_CLI_PJ.CNPJ, 
                   CAST(OSO.IDENT1 AS VARCHAR(100) CHARACTER SET OCTETS) AS MARCA_MODELO,
                   CAST(OSO.DEFEITO AS VARCHAR(300) CHARACTER SET OCTETS) AS DEFEITO_REPORTADO,
                   CAST(OBJ.DESCRICAO AS VARCHAR(100) CHARACTER SET OCTETS) AS TIPO_EQUIPAMENTO
            FROM TB_OS O
            INNER JOIN TB_CLIENTE C ON O.ID_CLIENTE = C.ID_CLIENTE
            LEFT JOIN TB_OS_OBJETO_OS OSO ON O.ID_OS = OSO.ID_OS
            LEFT JOIN TB_OS_OBJETO OBJ ON OSO.ID_OBJETO = OBJ.ID_OBJETO
            LEFT JOIN TB_CLI_PJ ON C.ID_CLIENTE = TB_CLI_PJ.ID_CLIENTE
            WHERE O.ID_OS = ?
        `;
        
        const rows = await db.executeQuery(sql, [idOs]);
        if (rows.length === 0) return res.redirect("/os");
        const os = rows[0];

        // Fetch Photos & Signature (Blobs)
        const fotosRaw = await db.executeQuery(`SELECT ID_FOTO, CAST(DESCRICAO AS VARCHAR(100) CHARACTER SET OCTETS) AS D, FOTO FROM TB_OS_FOTO WHERE ID_OS = ?`, [idOs]);
        
        const anexos = await Promise.all(fotosRaw.map(async f => {
            let src = null; 
            try { 
                const buffer = await readBlob(f.FOTO); 
                if(buffer) src = `data:image/jpeg;base64,${buffer.toString('base64')}`; 
            } catch(e){}
            return { ID: f.ID_FOTO, DESC: bufferToString(f.D), SRC: src };
        }));

        let signature = null; 
        const photos = []; 
        
        anexos.forEach(x => x.DESC === 'ASSINATURA_DIGITAL' ? signature = x.SRC : photos.push(x));

        // Fetch Items (Parts/Services)
        const itensRaw = await db.executeQuery(`SELECT I.ID_IDENTIFICADOR C, CAST(E.DESCRICAO AS VARCHAR(100) CHARACTER SET OCTETS) D, I.QTD_ITEM Q, I.VLR_UNIT U, I.VLR_TOTAL T FROM TB_OS_ITEM I LEFT JOIN TB_ESTOQUE E ON I.ID_IDENTIFICADOR = E.ID_ESTOQUE WHERE I.ID_OS=?`, [idOs]);
        const itens = itensRaw.map(x => ({ CODIGO: x.C, DESCRICAO: bufferToString(x.D), QTD: x.Q, UNITARIO: x.U, TOTAL: x.T }));

        // View Data Preparation
        os.DT_OS_FMT = os.DT_OS ? new Date(os.DT_OS).toISOString().split('T')[0] : '';
        os.OBSERVACAO_TEXTO = bufferToString(os.OBSERVACAO);
        os.NOME_CLIENTE_REAL = os.NOME_CLIENTE;
        os.NOME_EQUIPAMENTO_COMPLETO = (bufferToString(os.TIPO_EQUIPAMENTO)||"") + " " + (bufferToString(os.MARCA_MODELO)||"");
        os.ENDERECO_COMPLETO = `${os.END_LOGRAD||''}, ${os.END_NUMERO||''}, ${os.END_BAIRRO||''}`;

        res.render("os/form", { 
            os, 
            formAction: '/os/edit/'+idOs, 
            user: req.session.user, 
            isEditable: true, 
            isClosed: (os.ID_STATUS === WORKFLOW_STATUS.CLOSED), 
            fotos: photos, 
            assinatura: signature, 
            itens 
        });

    } catch (e) { res.status(500).send("Error loading form: " + e.message); }
});

// =========================================================================
// ACTION: SAVE EDIT (POST)
// =========================================================================
router.post("/edit/:id", async (req, res) => {
    const { ID_STATUS, OBSERVACAO, assinatura_base64, nova_foto_base64, nova_foto_descricao, lista_itens_json } = req.body;
    const idOs = req.params.id;
    const technicianId = req.session.user.ID_TECNICO;

    try {
        // 1. Immutable State Check
        const check = await db.executeQuery("SELECT ID_STATUS FROM TB_OS WHERE ID_OS = ?", [idOs]);
        if (check.length > 0 && check[0].ID_STATUS === WORKFLOW_STATUS.CLOSED) {
            return res.redirect("/os/edit/" + idOs); // Reload without saving
        }

        // 2. Status Mapping
        let statusFinal = parseInt(ID_STATUS);
        if (statusFinal === 1) statusFinal = WORKFLOW_STATUS.NEW;
        if (statusFinal === 2) statusFinal = WORKFLOW_STATUS.IN_PROGRESS;
        if (statusFinal === 3) statusFinal = WORKFLOW_STATUS.COMPLETED;
        if (statusFinal === 9) statusFinal = WORKFLOW_STATUS.CLOSED;

        // 3. Update Main OS Data
        await db.executeQuery("UPDATE TB_OS SET ID_STATUS = ?, OBSERVACAO = ? WHERE ID_OS = ?", [statusFinal, OBSERVACAO, idOs]);

        // 4. Handle Digital Signature (Binary)
        if (assinatura_base64 && assinatura_base64.length > 500) {
            const buf = Buffer.from(assinatura_base64.replace(/^data:image\/png;base64,/, ""), 'base64');
            // Remove old signature to avoid duplication
            await db.executeQuery("DELETE FROM TB_OS_FOTO WHERE ID_OS=? AND CAST(DESCRICAO AS VARCHAR(100))='ASSINATURA_DIGITAL'", [idOs]);
            
            const nextId = (await db.executeQuery("SELECT MAX(ID_FOTO) M FROM TB_OS_FOTO"))[0].M + 1;
            await db.executeQuery("INSERT INTO TB_OS_FOTO (ID_FOTO, ID_OS, FOTO, DESCRICAO) VALUES (?, ?, ?, 'ASSINATURA_DIGITAL')", [nextId, idOs, buf]);
        }

        // 5. Handle New Photo Upload (Binary)
        if (nova_foto_base64 && nova_foto_base64.length > 100) {
            const buf = Buffer.from(nova_foto_base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)[2], 'base64');
            const nextId = (await db.executeQuery("SELECT MAX(ID_FOTO) M FROM TB_OS_FOTO"))[0].M + 1;
            await db.executeQuery("INSERT INTO TB_OS_FOTO (ID_FOTO, ID_OS, FOTO, DESCRICAO) VALUES (?, ?, ?, ?)", [nextId, idOs, buf, nova_foto_descricao||'Foto']);
        }

        // 6. Handle Items List (Transactional Replace)
        if (lista_itens_json) {
            let items = []; 
            try { items = JSON.parse(lista_itens_json); } catch(e){}
            
            if (Array.isArray(items)) {
                // Full replace pattern: Delete all items and re-insert
                await db.executeQuery("DELETE FROM TB_OS_ITEM WHERE ID_OS=?", [idOs]);
                
                let nextItemId = (await db.executeQuery("SELECT MAX(ID_ITEMOS) M FROM TB_OS_ITEM"))[0].M || 0;
                
                for (const i of items) {
                    nextItemId++;
                    const qtd = parseFloat(i.qtd)||0;
                    const unit = parseFloat(i.unitario)||0;
                    
                    await db.executeQuery(
                        `INSERT INTO TB_OS_ITEM (ID_ITEMOS, ID_OS, ID_IDENTIFICADOR, QTD_ITEM, VLR_UNIT, VLR_TOTAL, ITEM_CANCEL, VLR_DESC, ALIQUOTA, POR_COMISSAO, ID_FUNCIONARIO) 
                         VALUES (?, ?, ?, ?, ?, ?, 'N', 0, 0, 0, ?)`, 
                        [nextItemId, idOs, parseInt(i.codigo)||0, qtd, unit, qtd*unit, technicianId]
                    );
                }
            }
        }
        res.redirect("/os/edit/" + idOs);

    } catch (e) { 
        console.error("Save Error:", e.message);
        res.send("Error saving data: " + e.message); 
    }
});

module.exports = router;