const crypto = require('crypto');
const pool = require('../config/database');

function makeCode(prefix) {
    return `${prefix}-${crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase()}`;
}

async function createClaim(req, res) {
    const postId = req.body.postId;
    const studentId = String(req.body.studentId || '').trim();
    const contact = String(req.body.contact || '').trim();
    const message = String(req.body.message || '').trim();
    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];

    if (!postId || !studentId || !contact || message.length < 10) {
        return res.status(400).json({
            message: 'Post, student ID, contact and a clear ownership message are required.'
        });
    }

    try {
        const postResult = await pool.query(
            `SELECT id, type, user_id, title, status, verification_questions
             FROM posts
             WHERE id = $1`,
            [postId]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const post = postResult.rows[0];

        if (post.type !== 'found' || post.status !== 'active') {
            return res.status(400).json({ message: 'Claims can only be created for active found posts.' });
        }

        if (post.user_id === req.user.id) {
            return res.status(400).json({ message: 'You cannot claim your own found post.' });
        }

        const duplicate = await pool.query(
            `SELECT id
             FROM claims
             WHERE post_id = $1
               AND claimer_id = $2
               AND status IN ('pending', 'approved')`,
            [postId, req.user.id]
        );

        const requiredQuestions = Array.isArray(post.verification_questions)
            ? post.verification_questions.filter((item) => item.required !== false)
            : [];

        for (const question of requiredQuestions) {
            const matchingAnswer = answers.find((item) => item.question === question.question);

            if (!matchingAnswer || !String(matchingAnswer.answer || '').trim()) {
                return res.status(400).json({
                    message: 'Please answer all required ownership questions.'
                });
            }
        }

        if (duplicate.rows.length > 0) {
            return res.status(409).json({ message: 'You already have an active claim for this post.' });
        }

        const trackingCode = makeCode('CLM');

        const result = await pool.query(
            `INSERT INTO claims (
                post_id,
                claimer_id,
                student_id,
                contact,
                message,
                answers,
                status,
                tracking_code
             )
             VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'pending', $7)
             RETURNING *`,
            [postId, req.user.id, studentId, contact, message, JSON.stringify(answers), trackingCode]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create claim error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

async function getMyClaims(req, res) {
    try {
        const result = await pool.query(
            `SELECT
                c.*,
                p.title AS post_title,
                p.image_url,
                p.location,
                p.category
             FROM claims c
             JOIN posts p ON p.id = c.post_id
             WHERE c.claimer_id = $1
             ORDER BY c.created_at DESC`,
            [req.user.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get my claims error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

async function trackClaim(req, res) {
    const code = String(req.params.code || '').trim().toUpperCase();

    try {
        const result = await pool.query(
            `SELECT
                c.tracking_code,
                c.status,
                c.pickup_code,
                c.admin_note,
                c.created_at,
                c.updated_at,
                p.title AS post_title
             FROM claims c
             JOIN posts p ON p.id = c.post_id
             WHERE c.tracking_code = $1`,
            [code]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Claim not found.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Track claim error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

async function getClaimsForPost(req, res) {
    const postId = req.params.postId;

    try {
        const postResult = await pool.query(
            'SELECT user_id FROM posts WHERE id = $1',
            [postId]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const isOwner = postResult.rows[0].user_id === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Permission denied.' });
        }

        const result = await pool.query(
            `SELECT
                c.*,
                u.full_name AS claimer_name,
                u.email AS claimer_email
             FROM claims c
             JOIN users u ON u.id = c.claimer_id
             WHERE c.post_id = $1
             ORDER BY c.created_at DESC`,
            [postId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get claims for post error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

async function getAllClaims(req, res) {
    try {
        const result = await pool.query(
            `SELECT
                c.*,
                p.title AS post_title,
                p.verification_questions,
                u.full_name AS claimer_name,
                u.email AS claimer_email
             FROM claims c
             JOIN posts p ON p.id = c.post_id
             JOIN users u ON u.id = c.claimer_id
             ORDER BY c.created_at DESC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get all claims error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

async function updateClaimStatus(req, res) {
    const claimId = req.params.id;
    const status = String(req.body.status || '').trim().toLowerCase();
    const adminNote = String(req.body.adminNote || '').trim();

    if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid claim status.' });
    }

    const pickupCode = status === 'approved' ? makeCode('REC') : null;

    try {
        const result = await pool.query(
            `UPDATE claims
             SET
                status = $1,
                admin_note = $2,
                pickup_code = CASE
                    WHEN $1 = 'approved' AND pickup_code IS NULL THEN $3
                    ELSE pickup_code
                END,
                updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [status, adminNote || null, pickupCode, claimId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Claim not found.' });
        }

        if (status === 'completed') {
            await pool.query(
                `UPDATE posts
                 SET status = 'resolved', updated_at = NOW()
                 WHERE id = $1`,
                [result.rows[0].post_id]
            );
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update claim status error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

module.exports = {
    createClaim,
    getMyClaims,
    trackClaim,
    getClaimsForPost,
    getAllClaims,
    updateClaimStatus
};
