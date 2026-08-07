const Category = require('../models/category.model');
const Item = require('../models/item.model');
const Event = require('../models/event.model');
const User = require('../models/user.model');
const Pagination = require('../utils/pagination');

async function getCategories(req, res, next){
    try{
        const features = new Pagination(Category.find(), req.query)
        .filter()
        .sort()
        .paginate();

        const categories = await features.query;
        const total = await Category.countDocuments(features.query.getFilter());

        return res.status(200).json({
            success: true,
            message: "Categories fetched successfully.",
            data:{
                pagination: features.getPaginationMeta(total),
                count: categories.length,
                categories
            }
        });
    }
    catch(err){
        next(err);
    }
}

async function getItemsByCategory(req, res, next){
    try{
        const {categorySlug} = req.params;

        const category = await Category.findOne({slug: categorySlug.toLowerCase().trim()});
        if(!category){
            return res.status(404).json({
                success: false,
                message:"Target category not found"
            });
        }

        let baseQuery = Item.find({categoryId: category._id});

        if(req.query.search){
            baseQuery = baseQuery.select('displayName slug _id');
        }

        const features = new Pagination(Item.find({categoryId: category._id}), req.query)
        .search(['displayName', 'slug'])
        .filter()
        .sort()
        .paginate();

        const items = await features.query;
        const total = await Item.countDocuments(features.query.getFilter());

        return res.status(200).json({
            success: true,
            message: "Items fetched successfully",
            data:{
                category: category.displayName,
                pagination: features.getPaginationMeta(total),
                count: items.length,
                items
            }
        });
    }
    catch(err){
        next(err);
    }
}

async function getEventsByItem(req, res, next){
    try{
        const {itemSlug} = req.params;

        const item = await Item.findOne({slug: itemSlug.toLowerCase().trim()});
        if(!item){
            return res.status(404).json({
                success: false,
                message:"Target item entity not found"
            });
        }

        const features =  new Pagination(Event.find({itemId: item._id}), req.query)
        .filter()
        .sort('startTime')
        .paginate();

        const events = await features.query;
        const total = await Event.countDocuments(features.query.getFilter());

        return res.status(200).json({
            success: true,
            message: "Events fetched successfully",
            data:{
                item: item.displayName,
                pagination: features.getPaginationMeta(total),
                count: events.length,
                events
            }
        });
    }
    catch(err){
        next(err);
    }
}

async function toggleSubscription(req, res, next){
    try{
        const {eventId} = req.body;
        const userId = req.user.id;

        if(!eventId){
            return res.status(400).json({
                success: false,
                message:"Missing target eventId identifier in request body"
            });
        }

        const eventExists = await Event.findById(eventId);
        if(!eventExists){
            return res.status(404).json({
                success: false,
                message:"Target event not found"
            });
        }

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User account records could not be resolved"
            });
        }

        const isAlreadySubscribed = user.subscriptions.some((subId) => subId.toString() === eventId);
        //const isAlreadySubscribed = user.subscriptions.includes(eventId);

        const updateQuery = isAlreadySubscribed ? {$pull:{subscriptions: eventId}} : {$addToSet: {subscriptions: eventId}};
        await User.findByIdAndUpdate(userId, updateQuery);

        return res.status(200).json({
            success: true,
            message: isAlreadySubscribed ? 
            "Subscription revoked successfully" : "Subscription registered successfully",
            data:{
                isSubscribed: !isAlreadySubscribed
            }
        });
    }
    catch(err){
        next(err);
    }
}

module.exports = { getCategories, getItemsByCategory, getEventsByItem, toggleSubscription }
