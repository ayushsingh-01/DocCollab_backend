const Document = require('../models/Document');

const authorizeDocument = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const document = await Document.findById(req.params.id);
            if (!document) {
                return res.status(404).json({ message: 'Document not found' });
            }

            const userId = req.user._id.toString();
            const isOwner = document.owner.toString() === userId;

            let userRole = null;
            if (isOwner) {
                userRole = 'owner';
            } else {
                const sharedUser = document.sharedWith.find(
                    (share) => share.userId.toString() === userId
                );
                if (sharedUser) {
                    userRole = sharedUser.role; // 'viewer' or 'editor'
                }
            }

            if (!userRole) {
                return res.status(403).json({ message: 'Not authorized to access this document' });
            }

            // Hierarchy: owner (3) > editor (2) > viewer (1)
            const roleHierarchy = {
                owner: 3,
                editor: 2,
                viewer: 1,
            };

            const userRoleLevel = roleHierarchy[userRole];

            // Determine the minimum role level required amongst the allowed roles passed
            const minRequiredLevel = Math.min(...allowedRoles.map(role => roleHierarchy[role]));

            if (userRoleLevel < minRequiredLevel) {
                return res.status(403).json({ message: `Insufficient permissions. Requires at least: ${allowedRoles.join(', ')}` });
            }

            // Attach document to request object to avoid redundant database calls in controllers
            req.document = document;
            next();
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    };
};

module.exports = { authorizeDocument };
