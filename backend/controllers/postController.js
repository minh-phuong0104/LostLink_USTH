const crypto = require('crypto');
const pool = require('../config/database');

const PUBLIC_POST_FIELDS = `
    p.id,
    p.user_id,
    p.type,
    p.title,
    p.description,
    p.category,
    p.location,
    p.location_detail,
    p.event_date,
    p.image_url,
    p.status,
    p.phone,
    p.email,
    p.high_value,
    p.custody_location,
    p.reporter_name,
    p.reporter_role,
    p.verification_questions,
    p.created_at,
    p.updated_at,
    u.full_name AS author_name
`;

function normalizeType(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizeStatus(value) {
    return String(value || '').trim().toLowerCase();
}

function makeManagementCode() {
    return `LL-${crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase()}`;
}

function publicQuestions(questions) {
    if (!Array.isArray(questions)) {
        return [];
    }

    return questions.map((item, index) => ({
        id: item.id || `q${index + 1}`,
        question: String(item.question || '').trim(),
        required: item.required !== false
    })).filter((item) => item.question);
}

function hidePrivatePostData(post) {
    return {
        ...post,
        verification_questions: publicQuestions(post.verification_questions)
    };
}

function validatePostInput(body) {
    const type = normalizeType(body.type);
    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    const category = String(body.category || '').trim();
    const location = String(body.location || '').trim();
    const eventDate = String(body.eventDate || '').trim();

    if (!['lost', 'found'].includes(type)) {
        return 'Type must be lost or found.';
    }

    if (title.length < 5) {
        return 'Title must contain at least 5 characters.';
    }

    if (!description || !category || !location || !eventDate) {
        return 'Description, category, location and event date are required.';
    }

    const parsedDate = new Date(eventDate);
    if (Number.isNaN(parsedDate.getTime())) {
        return 'Event date is invalid.';
    }

    return null;
}

async function getPosts(req, res) {
    const type = normalizeType(req.query.type);
    const search = String(req.query.search || '').trim();
    const category = String(req.query.category || '').trim();
    const location = String(req.query.location || '').trim();
    const requestedStatus = normalizeStatus(req.query.status || 'active');
    const sort = String(req.query.sort || 'newest');

    const conditions = [];
    const values = [];

    if (type && ['lost', 'found'].includes(type)) {
        values.push(type);
        conditions.push(`p.type = $${values.length}`);
    }

    if (search) {
        values.push(`%${search}%`);
        conditions.push(`(
            p.title ILIKE $${values.length}
            OR p.description ILIKE $${values.length}
            OR p.location ILIKE $${values.length}
            OR p.category ILIKE $${values.length}
        )`);
    }

    if (category) {
        values.push(category);
        conditions.push(`p.category = $${values.length}`);
    }

    if (location) {
        values.push(`%${location}%`);
        conditions.push(`p.location ILIKE $${values.length}`);
    }

    if (requestedStatus && ['active', 'resolved', 'closed', 'hidden'].includes(requestedStatus)) {
        values.push(requestedStatus);
        conditions.push(`p.status = $${values.length}`);
    }

    const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    let orderBy = 'ORDER BY p.created_at DESC';
    if (sort === 'oldest') orderBy = 'ORDER BY p.created_at ASC';
    if (sort === 'title') orderBy = 'ORDER BY p.title ASC';

    try {
        const result = await pool.query(
            `SELECT ${PUBLIC_POST_FIELDS}
             FROM posts p
             JOIN users u ON u.id = p.user_id
             ${whereClause}
             ${orderBy}`,
            values
        );

        res.json(result.rows.map(hidePrivatePostData));
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

async function getPostById(req, res) {
    const postId = req.params.id;

    try {
        const result = await pool.query(
            `SELECT ${PUBLIC_POST_FIELDS}
             FROM posts p
             JOIN users u ON u.id = p.user_id
             WHERE p.id = $1`,
            [postId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        res.json(hidePrivatePostData(result.rows[0]));
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

async function getMyPosts(req, res) {
    try {
        const result = await pool.query(
            `SELECT
                p.*,
                u.full_name AS author_name
             FROM posts p
             JOIN users u ON u.id = p.user_id
             WHERE p.user_id = $1
             ORDER BY p.created_at DESC`,
            [req.user.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get my posts error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

async function createPost(req, res) {
    const validationError = validatePostInput(req.body);

    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    const type = normalizeType(req.body.type);
    const title = String(req.body.title).trim();
    const description = String(req.body.description).trim();
    const category = String(req.body.category).trim();
    const location = String(req.body.location).trim();
    const locationDetail = String(req.body.locationDetail || '').trim();
    const eventDate = req.body.eventDate;
    const imageUrl = String(req.body.imageUrl || '').trim();
    const phone = String(req.body.phone || '').trim();
    const email = String(req.body.email || '').trim();
    const highValue = Boolean(req.body.highValue);
    const custodyLocation = String(req.body.custodyLocation || '').trim();
    const reporterName = String(req.body.reporterName || '').trim();
    const reporterRole = String(req.body.reporterRole || '').trim();
    const verificationQuestions = Array.isArray(req.body.verificationQuestions)
        ? req.body.verificationQuestions
        : [];
    const managementCode = makeManagementCode();

    try {
        const result = await pool.query(
            `INSERT INTO posts (
                user_id,
                type,
                title,
                description,
                category,
                location,
                location_detail,
                event_date,
                image_url,
                status,
                phone,
                email,
                high_value,
                custody_location,
                reporter_name,
                reporter_role,
                verification_questions,
                management_code
             )
             VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, 'active',
                $10, $11, $12, $13, $14, $15, $16::jsonb, $17
             )
             RETURNING *`,
            [
                req.user.id,
                type,
                title,
                description,
                category,
                location,
                locationDetail,
                eventDate,
                imageUrl || null,
                phone,
                email || null,
                highValue,
                custodyLocation || null,
                reporterName || null,
                reporterRole || null,
                JSON.stringify(verificationQuestions),
                managementCode
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

async function updatePost(req, res) {
    const postId = req.params.id;

    try {
        const currentResult = await pool.query(
            'SELECT * FROM posts WHERE id = $1',
            [postId]
        );

        if (currentResult.rows.length === 0) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const currentPost = currentResult.rows[0];
        const isOwner = currentPost.user_id === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: 'You do not have permission to edit this post.'
            });
        }

        const mergedBody = {
            ...currentPost,
            ...req.body,
            eventDate: req.body.eventDate || currentPost.event_date
        };

        const validationError = validatePostInput(mergedBody);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const verificationQuestions = Array.isArray(req.body.verificationQuestions)
            ? req.body.verificationQuestions
            : currentPost.verification_questions;

        const result = await pool.query(
            `UPDATE posts
             SET
                type = $1,
                title = $2,
                description = $3,
                category = $4,
                location = $5,
                location_detail = $6,
                event_date = $7,
                image_url = $8,
                phone = $9,
                email = $10,
                high_value = $11,
                custody_location = $12,
                reporter_name = $13,
                reporter_role = $14,
                verification_questions = $15::jsonb,
                updated_at = NOW()
             WHERE id = $16
             RETURNING *`,
            [
                normalizeType(req.body.type || currentPost.type),
                String(req.body.title || currentPost.title).trim(),
                String(req.body.description || currentPost.description).trim(),
                String(req.body.category || currentPost.category).trim(),
                String(req.body.location || currentPost.location).trim(),
                String(req.body.locationDetail ?? currentPost.location_detail ?? '').trim(),
                req.body.eventDate || currentPost.event_date,
                req.body.imageUrl ?? currentPost.image_url,
                String(req.body.phone ?? currentPost.phone ?? '').trim(),
                String(req.body.email ?? currentPost.email ?? '').trim() || null,
                req.body.highValue ?? currentPost.high_value,
                String(req.body.custodyLocation ?? currentPost.custody_location ?? '').trim() || null,
                String(req.body.reporterName ?? currentPost.reporter_name ?? '').trim() || null,
                String(req.body.reporterRole ?? currentPost.reporter_role ?? '').trim() || null,
                JSON.stringify(verificationQuestions || []),
                postId
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

async function updateOwnPostStatus(req, res) {
    const postId = req.params.id;
    const status = normalizeStatus(req.body.status);

    if (!['active', 'resolved', 'closed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid post status.' });
    }

    try {
        const result = await pool.query(
            `UPDATE posts
             SET status = $1, updated_at = NOW()
             WHERE id = $2 AND user_id = $3
             RETURNING *`,
            [status, postId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Post not found or not owned by you.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update own post status error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

async function deletePost(req, res) {
    const postId = req.params.id;

    try {
        const result = await pool.query(
            `DELETE FROM posts
             WHERE id = $1
               AND (user_id = $2 OR $3 = 'admin')
             RETURNING id`,
            [postId, req.user.id, req.user.role]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Post not found or permission denied.' });
        }

        res.json({ message: 'Post deleted.' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

module.exports = {
    getPosts,
    getPostById,
    getMyPosts,
    createPost,
    updatePost,
    updateOwnPostStatus,
    deletePost
};
