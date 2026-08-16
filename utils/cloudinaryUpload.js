const cloudinary = require('../config/cloudinary');

const uploadBuffer = (buffer, options = {}) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'lanka-ads', resource_type: 'image', ...options },
            (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(buffer);
    });

const destroy = (publicId) => cloudinary.uploader.destroy(publicId);

module.exports = { uploadBuffer, destroy };