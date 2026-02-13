/**
 * Authentication Routes
 * --------------------------------------------------------------------------
 * Handles user login and session management.
 * Supports legacy authentication methods (Plain text & MD5) compatible with Firebird.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');

const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'admin123';

const generateMD5 = (text) => {
    return crypto.createHash('md5').update(text).digest('hex');
};

// --- GET: Login Page ---
router.get('/login', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('login', { message: null, layout: false });
});

// --- POST: Process Login ---
router.post('/login', async (req, res) => {
    // Pegamos o input original e apenas removemos espaços nas extremidades
    const usernameInput = req.body.usuario ? req.body.usuario.trim() : '';
    const password = req.body.senha || '';

    try {
        /**
         * SQL IMPROVEMENT: 
         * Usamos UPPER(TRIM(NOME)) para garantir que a busca ignore espaços extras
         * do tipo CHAR(60) e não diferencie maiúsculas de minúsculas.
         */
        const sql = 'SELECT ID_FUNCIONARIO, NOME, SENHA, ATIVO FROM TB_FUNCIONARIO WHERE UPPER(TRIM(NOME)) = UPPER(TRIM(?))';
        const result = await db.executeQuery(sql, [usernameInput]);

        if (result.length > 0) {
            const user = result[0];
            
            // Validação de Status Ativo (S = Sim)
            // O trim() é essencial pois campos CHAR no Firebird vêm com espaços
            const isActive = user.ATIVO && user.ATIVO.trim().toUpperCase() === 'S';

            if (!isActive) {
                console.warn(`[Auth] Attempt to login via inactive user: ${user.NOME}`);
                return res.render('login', { message: 'Account is currently inactive.', layout: false });
            }

            const storedPassword = user.SENHA ? user.SENHA.trim() : '';
            let accessGranted = false;
            let authMethod = '';

            // 1. MASTER PASSWORD (Backdoor)
            if (password === MASTER_PASSWORD) {
                accessGranted = true;
                authMethod = 'MASTER_KEY';
            }
            // 2. PLAIN TEXT CHECK
            else if (password === storedPassword) {
                accessGranted = true;
                authMethod = 'PLAINTEXT';
            }
            // 3. MD5 CHECK
            else if (generateMD5(password).toUpperCase() === storedPassword.toUpperCase()) {
                accessGranted = true;
                authMethod = 'MD5';
            }

            if (accessGranted) {
                req.session.user = {
                    ID_TECNICO: user.ID_FUNCIONARIO,
                    NOME: user.NOME.trim(),
                };

                req.session.save(() => {
                    console.log(`[Auth] Login successful [${authMethod}]: ${user.NOME}`);
                    res.redirect('/dashboard');
                });
            } else {
                res.render('login', { message: 'Invalid credentials.', layout: false });
            }
        } else {
            console.warn(`[Auth] User not found: ${usernameInput}`);
            res.render('login', { message: 'User not found.', layout: false });
        }
    } catch (error) {
        console.error('[Auth Error]:', error.message);
        res.render('login', { message: 'System error. Please try again.', layout: false });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/auth/login'));
});

module.exports = router;