const { createClient } = require('@supabase/supabase-js');

function getSupabaseClient() {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        return null;
    }

    return createClient(url, serviceRoleKey);
}

async function uploadImage(req, res) {
    if (!req.file) {
        return res.status(400).json({ message: 'Please choose an image.' });
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
        return res.status(503).json({
            message: 'Image upload is not configured on the backend yet.'
        });
    }

    const bucket = process.env.SUPABASE_BUCKET || 'lostlink-images';
    const extension = req.file.originalname.split('.').pop() || 'jpg';
    const fileName = `${req.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    try {
        const { error } = await supabase.storage
            .from(bucket)
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return res.status(500).json({ message: 'Could not upload image.' });
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);

        res.status(201).json({ imageUrl: data.publicUrl });
    } catch (error) {
        console.error('Upload image error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

module.exports = {
    uploadImage
};
