const Category = require('../models/category.model');
const Item = require('../models/item.model');
const Event = require('../models/event.model');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const uploadFile = require('../services/storage.services');

async function createCategory(req, res, next){
    try{
        const { slug, displayName} = req.body;
        let backgroundImage = req.body.backgroundImage;

        if(req.file){
            const uploadResult = await uploadFile(req.file.buffer);
            backgroundImage = uploadResult.url;
        }

        if(!slug || !displayName || !backgroundImage){
            return res.status(400).json({
                success: false,
                message: "Slug, display name, and background image are required."
            });
        }

        const formattedSlug = slug.toLowerCase().trim();
        const categoryExists = await Category.findOne({slug: formattedSlug});
        if(categoryExists){
            return res.status(409).json({
                success: false,
                message: "Category slug already exists."
            });
        }

        const category = await Category.create({slug: formattedSlug, displayName, backgroundImage});

        return res.status(201).json({
            success: true,
            message: "Category created successfully.",
            data: {category}
        });
    }
    catch(err){
        next(err);
    }
}

async function updateCategory(req, res, next){
    try{
        const {id} = req.params;
        const {slug, displayName} = req.body;
        let backgroundImage = req.body.backgroundImage;

        const category = await Category.findById(id);
        if(!category){
            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }

        if(req.file){
            const uploadResult = await uploadFile(req.file.buffer);
            backgroundImage = uploadResult.url;
        }

        if(slug) category.slug = slug.toLowerCase().trim();
        if(displayName) category.displayName = displayName;
        if(backgroundImage) category.backgroundImage = backgroundImage;

        await category.save();

        return res.status(200).json({
            success: true,
            message: "Category updated successfully.",
            data: {category}
        });
    }
    catch(err){
        if(err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Category slug already exists."
            });
        }
        next(err);
    }
}

async function deleteCategory(req, res, next){
    try{
        const {id} = req.params;

        const category = await Category.findById(id);
        if(!category){
            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }

        const items = await Item.find({categoryId: id});
        const itemIds = items.map(item => item._id);

        if(itemIds.length > 0){
            await Event.deleteMany({itemId: {$in: itemIds}});
        }

        await Category.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Category and all nested data are successfully deleted."
        });
    }
    catch(err){
        next(err);
    }
}


async function createItem(req, res, next){
    try{
        const {categoryId, slug, displayName} = req.body;
        let thumbnailImage = req.body.thumbnailImage;

        if(req.file){
            const uploadResult = await uploadFile(req.file.buffer);
            thumbnailImage = uploadResult.url;
        }

        if(!categoryId || !slug || !displayName || !thumbnailImage){
            return res.status(400).json({
                success: false,
                message: "Category ID, slug, display name, and thumbnail image are required."
            });
        }

        const categoryExists = await Category.findById(categoryId);
        if(!categoryExists){
            return res.status(404).json({
                success: false,
                message: "Parent category not found."
            });
        }

        const formattedSlug = slug.toLowerCase().trim();
        const itemExists = await Item.findOne({slug: formattedSlug});
        if(itemExists){
            return res.status(409).json({
                success: false,
                message: "Item slug already exists."
            });
        }

        const item = await Item.create({categoryId, slug: formattedSlug, displayName, thumbnailImage});

        return res.status(201).json({
            success: true,
            message: "Item created successfully.",
            data: {item}
        });
    }
    catch(err){
        next(err);
    }
}

async function updateItem(req, res, next){
    try{
        const {id} = req.params;
        const {categoryId, slug, displayName} = req.body;
        let thumbnailImage = req.body.thumbnailImage;

        const item = await Item.findById(id);
        if(!item){
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }

        if(req.file){
            const uploadResult = await uploadFile(req.file.buffer);
            thumbnailImage = uploadResult.url;
        }

        if(categoryId) item.categoryId = categoryId;
        if(slug) item.slug = slug.toLowerCase().trim();
        if(displayName) item.displayName = displayName;
        if(thumbnailImage) item.thumbnailImage = thumbnailImage;

        await item.save();

        return res.status(200).json({
            success: true,
            message: "Item uploaded successfully.",
            data: {item}
        });
    }
    catch(err){
        if(err.code === 11000){
            return res.status(409).json({
                success: false,
                message: "Item slug already exists."
            });
        }
        next(err);
    }
}

async function deleteItem(req, res, next){
    try{ 
        const {id} = req.params;

        const item = await Item.findById(id);
        if(!item){
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }

        await Event.deleteMany({itemId: id});

        await Item.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Item and all nested events are successfully deleted."
        });
    }
    catch(err){
        next(err);
    }
}


async function createEvent(req, res, next){
    try{
        const {itemId, eventName, startTime, endTime, externalLinks = []} = req.body;
        let eventImage = req.body.eventImage;

        if(req.file){
            const uploadResult = await uploadFile(req.file.buffer);
            eventImage = uploadResult.url;
        }

        if(!itemId || !eventName || !eventImage || !startTime || !endTime){
            return res.status(400).json({
                success: false,
                message: "Missing required event fields."
            });
        }

        const itemExists = await Item.findById(itemId);
        if(!itemExists){
            return res.status(404).json({
                success: false,
                message: "Parent item not found."
            });
        }

        const event = await Event.create({
            itemId,
            eventName,
            eventImage,
            startTime,
            endTime,
            externalLinks
        });

        return res.status(201).json({
            success: true,
            message: "Global event created successfully.",
            data: {event}
        });
    }
    catch(err){
        next(err);
    }
}

async function updateEvent(req, res, next){
    try{
        const {id} = req.params;
        const {eventName, startTime, endTime, externalLinks} = req.body;
        let eventImage = req.body.eventImage;

        const event = await Event.findById(id);
        if(!event){
            return res.status(404).json({
                success: false,
                message: "Event not found."
            });
        }

        if(req.file){
            const uploadResult = await uploadFile(req.file.buffer);
            eventImage = uploadResult.url;
        }

        if(eventName) event.eventName = eventName;
        if(eventImage) event.eventImage = eventImage;
        if(startTime) event.startTime = startTime;
        if(endTime) event.endTime = endTime;
        if(externalLinks) event.externalLinks = externalLinks;

        await event.save();

        return res.status(200).json({
            success: true,
            message: "Event updated successfully.",
            data: {event}
        });
    }
    catch(err){
        next(err);
    }
}

async function deleteEvent(req, res, next){
    try{
        const {id} = req.params;

        const event = await Event.findByIdAndDelete(id);
        if(!event){
            return res.status(404).json({
                success: false, 
                message: "Event not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event successfully deleted."
        });
    }
    catch(err){
        next(err);
    }
}


async function purgeExpiredEvents(req, res, next){
    try{
        const result = await Event.deleteMany({endTime: {$lt: new Date()}});

        return res.status(200).json({
            success: true,
            message: `Purge complete. Removed ${result.deletedCount} expired event(s).`,
            data: {deletedCount: result.deletedCount}
        });
    }
    catch(err){
        next(err);
    }
}

async function modifyUserRole(req, res, next){
    try{
        const {targetUserId, newRole} = req.body;
        const executorRole = req.user.role;

        if(!targetUserId || !newRole){
            return res.status(400).json({
                success: false,
                message: "Target user ID and new role are required."
            });
        }

        if(!['user', 'support', 'admin'].includes(newRole)){
            return res.status(400).json({
                success: false,
                message: "Invalid role specified."
            });
        }

        if(newRole === 'admin' && executorRole !== 'owner'){
            return res.status(403).json({
                success: false,
                message: "Forbidden: Only the Owner can appoint new Admin."
            });
        }

        const targetUser = await User.findById(targetUserId);
        if(!targetUser){
            return res.status(404).json({
                success: false,
                message: "Target user not found."
            });
        }

        if((targetUser.role === 'admin' || targetUser.role === 'owner') && executorRole !== 'owner'){
            return res.status(403).json({
                success: false,
                message: "Forbidden: You cannot modify the role of an Admin or Owner."
            });
        }

        targetUser.role = newRole;
        await targetUser.save();

        return res.status(200).json({
            success: true,
            message: `User role successfully updated to ${newRole}.`,
            data: {userId: targetUser._id, role: targetUser.role}
        });
    }
    catch(err){
        next(err);
    }
}

async function transferOwnership(req, res, next){
    try{
        const {newOwnerEmail, masterRecoveryKey} = req.body;
        const currentOwnerId = req.user.id;

        if(!newOwnerEmail || !masterRecoveryKey){
            return res.status(400).json({
                success: false,
                message: "Target email and Master Recovery Key are required."
            });
        }

        const currentOwner = await User.findById(currentOwnerId);

        if(!currentOwner.masterTransferHash){
            return res.status(400).json({
                success: false,
                message: "Transfer protocol is not configured on this account."
            });
        }

        const isKeyValid = await bcrypt.compare(masterRecoveryKey, currentOwner.masterTransferHash);
        if(!isKeyValid){
            return res.status(401).json({
                success: false,
                message: "Invalid Master Recovery Key."
            });
        }

        const newOwner = await User.findOne({email: newOwnerEmail.toLowerCase().trim()});
        if(!newOwner){
            return res.status(404).json({
                success: false,
                message: "Target user account not found."
            });
        }

        currentOwner.role = 'admin';
        newOwner.role = 'owner';

        currentOwner.masterTransferHash = null;

        await Promise.all([currentOwner.save(), newOwner.save()]);

        return res.status(200).json({
            success: true,
            message: "Platform ownership transferred successfully."
        });
    }
    catch(err){
        next(err);
    }
}

module.exports = {
    createCategory,
    updateCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem,
    createEvent,
    updateEvent,
    deleteEvent,
    purgeExpiredEvents,
    modifyUserRole,
    transferOwnership
}