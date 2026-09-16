const crypto = require('crypto');
const pool = require('../config/database');

function makeTrackingCode() {
    return `FB-${crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase()}`;
}

async function createFeedback(req, res) {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();
    const postId = req.body.postId || null;

    if (!name || !email || !subject || message.length < 5) {
        return res.status(400).json({ message: 'Please complete all feedback fields.' });
    }

    try {
        const trackingCode = makeTrackingCode();
        const userId = req.user ? req.user.id : null;

        const result = await pool.query(
            `INSERT INTO feedback (
                user_id,
                post_id,
                name,
                email,
                subject,
                message,
                status,
                tracking_code
             )
             VALUES ($1, $2, $3, $4, $5, $6, 'new', $7)
             RETURNING *`,
            [userId, postId, name, email, subject, message, trackingCode]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create feedback error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

async function trackFeedback(req, res) {
    const code = String(req.params.code || '').trim().toUpperCase();

    try {
        const result = await pool.query(
            `SELECT
                tracking_code,
                subject,
                status,
                admin_reply,
                created_at,
                updated_at
             FROM feedback
             WHERE tracking_code = $1`,
            [code]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Feedback not found.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Track feedback error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

async function getAllFeedback(req, res) {
    try {
        const result = await pool.query(
            `SELECT *
             FROM feedback
             ORDER BY created_at DESC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get feedback error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

async function updateFeedback(req, res) {
    const feedbackId = req.params.id;
    const status = String(req.body.status || '').trim().toLowerCase();
    const adminReply = String(req.body.adminReply || '').trim();

    if (!['new', 'read', 'resolved'].includes(status)) {
        return res.status(400).json({ message: 'Invalid feedback status.' });
    }

    try {
        const result = await pool.query(
            `UPDATE feedback
             SET
                status = $1,
                admin_reply = $2,
                updated_at = NOW()
             WHERE id = $3
             RETURNING *`,
            [status, adminReply || null, feedbackId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Feedback not found.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update feedback error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

module.exports = {
    createFeedback,
    trackFeedback,
    getAllFeedback,
    updateFeedback
};
