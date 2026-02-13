/**
 * Dashboard Controller
 * --------------------------------------------------------------------------
 * Handles the main dashboard view, calculating KPIs and listing daily tasks.
 * Connects with the legacy Firebird database to fetch real-time metrics.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Adjusted path

// Legacy System Status IDs
// 23: New, 21: In Progress, 22: Completed (Waiting for pickup), 9: Closed (Finished)
const STATUS = { 
    NEW: 23, 
    IN_PROGRESS: 21, 
    COMPLETED: 22, 
    CLOSED: 9 
};

/**
 * Helper: Converts database BLOBs/Octets to readable strings.
 * Essential for handling legacy Firebird 'latin1' or binary text fields.
 */
const bufferToString = (blob) => {
    if (!blob) return '';
    if (Buffer.isBuffer(blob)) return blob.toString('latin1');
    return String(blob);
};

// --- GET: Main Dashboard ---
router.get('/', async (req, res) => {
    const user = req.session.user;
    
    // Auth Check
    if (!user) return res.redirect('/auth/login');
    
    const technicianId = user.ID_TECNICO;

    try {
        // 1. KPI COUNTERS (Aggregated Data)
        // Logic: Count ALL open tickets, but only count Closed tickets from TODAY.
        const sqlCounts = `
            SELECT 
                SUM(CASE WHEN ID_STATUS = ${STATUS.NEW} THEN 1 ELSE 0 END) AS NOVAS,
                SUM(CASE WHEN ID_STATUS = ${STATUS.IN_PROGRESS} THEN 1 ELSE 0 END) AS ANDAMENTO,
                SUM(CASE WHEN ID_STATUS = ${STATUS.COMPLETED} THEN 1 ELSE 0 END) AS AGUARDANDO,
                SUM(CASE WHEN ID_STATUS = ${STATUS.CLOSED} AND DT_OS = CURRENT_DATE THEN 1 ELSE 0 END) AS FECHADAS
            FROM TB_OS 
            WHERE ID_TECNICO_RESP = ?
        `;
        
        const rawCounts = await db.executeQuery(sqlCounts, [technicianId]);
        const counts = rawCounts[0] || { NOVAS: 0, ANDAMENTO: 0, AGUARDANDO: 0, FECHADAS: 0 };

        // 2. DAILY SCHEDULE (Quick List)
        // Fetches the most recent interactions or appointments for the current day
        const sqlList = `
            SELECT FIRST 50 
                O.ID_OS, O.DT_OS, O.HR_OS, O.ID_STATUS, O.COMPRADOR, 
                C.NOME AS NOME_CLIENTE, C.FONE_CELUL,
                CAST(OBJ.DESCRICAO AS VARCHAR(100) CHARACTER SET OCTETS) AS TIPO,
                CAST(OSO.IDENT1 AS VARCHAR(100) CHARACTER SET OCTETS) AS MODELO,
                CAST(OSO.DEFEITO AS VARCHAR(300) CHARACTER SET OCTETS) AS DEFEITO
            FROM TB_OS O 
            LEFT JOIN TB_CLIENTE C ON O.ID_CLIENTE = C.ID_CLIENTE
            LEFT JOIN TB_OS_OBJETO_OS OSO ON O.ID_OS = OSO.ID_OS 
            LEFT JOIN TB_OS_OBJETO OBJ ON OSO.ID_OBJETO = OBJ.ID_OBJETO
            WHERE O.ID_TECNICO_RESP = ? AND O.DT_OS = CURRENT_DATE 
            ORDER BY O.HR_OS DESC
        `;
        
        const rawList = await db.executeQuery(sqlList, [technicianId]);

        // Data Transformation (DTO mapping)
        const tickets = rawList.map(os => ({
            raw_id: os.ID_OS,
            id: `OS #${os.ID_OS}`,
            client_name: os.NOME_CLIENTE || 'Unknown Client',
            // Concatenates Equipment Type + Model (e.g., "Notebook Dell Inspiron")
            equip_title: (bufferToString(os.TIPO) + ' ' + bufferToString(os.MODELO)).trim(),
            defect_desc: bufferToString(os.DEFEITO),
            status_id: os.ID_STATUS,
            requester: os.COMPRADOR || '-',
            contact: os.FONE_CELUL || '-',
            time: os.HR_OS ? String(os.HR_OS).substring(0, 5) : ''
        }));

        // Filter lists for the view
        const newTickets = tickets.filter(t => t.status_id == STATUS.NEW);
        const inProgressTickets = tickets.filter(t => t.status_id == STATUS.IN_PROGRESS);

        // Render View
        res.render('dashboard', { 
            user, 
            stats: { 
                new: counts.NOVAS, 
                pending: counts.ANDAMENTO, 
                awaitingClosure: counts.AGUARDANDO, 
                closed: counts.FECHADAS 
            },
            newTickets, 
            inProgressTickets, 
            currentDate: new Date().toLocaleDateString('pt-BR'), 
            currentPage: 'dashboard'
        });

    } catch (err) {
        console.error("[Dashboard Error]:", err.message);
        // Render with empty data to avoid crashing the UI
        res.render('dashboard', { 
            user, 
            stats: { new: 0, pending: 0, awaitingClosure: 0, closed: 0 }, 
            newTickets: [], 
            inProgressTickets: [], 
            currentPage: 'dashboard' 
        });
    }
});

module.exports = router;