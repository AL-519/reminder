const Ticket = require('../models/ticket.model');

async function createTicket(req, res, next){
    try{
        const {issueDescription, attachedAssetId, attachedAssetType, occurrenceTime} = req.body;
        const userId = req.user.id;

        if(!issueDescription){
            return res.status(400).json({
                success: false,
                message: "Issue description is required to open a ticket."
            });
        }

        if((attachedAssetId && !attachedAssetType) || (!attachedAssetId && attachedAssetType)){
            return res.status(400).json({
                success: false,
                message: "Both Asset ID and Asset Type must be provided together."
            });
        }

        const ticket = await Ticket.create({
            userId,
            issueDescription,
            attachedAssetId: attachedAssetId || undefined,
            attachedAssetType: attachedAssetType || undefined,
            occurrenceTime: occurrenceTime || new Date()
        });

        return res.status(201).json({
            success: true,
            message: "Support ticket submitted successfully.",
            data:{ticket}
        });
    }
    catch(err){
        next(err);
    }
}

async function getTickets(req, res, next){
    try{
        const {status} = req.query;
        const query = status ? {status: status.toLowerCase()} : {};
        const tickets = await Ticket.find(query).sort({createdAt:1});

        return res.status(200).json({
            success: true,
            message: "Ticket queue fetched successfully.",
            data: {
                count: tickets.length,
                tickets
            }
        });
    }
    catch(err){
        next(err);
    }
}

async function getTicketAsset(req, res, next){
    try{
        const {id} = req.params;
        const ticket = await Ticket.findById(id).populate('attachedAssetId');

        if(!ticket){
            return res.status(404).json({
                success: false,
                message: "Ticket not found."
            });
        }

        if(!ticket.attachedAssetId){
            return res.status(404).json({
                success: false,
                message: "No asset was attached to this ticket."
            });
        }

        if(['resolved', 'closed'].includes(ticket.status)){
            return res.status(403).json({
                success: false,
                message: "Forbidden: Cannot access user asset data on resolved or closed tickets."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Ticket asset fetched successfully.",
            data: {
                assetType: ticket.attachedAssetType,
                asset: ticket.attachedAssetId
            }
        });
    }
    catch(err){
        next(err);
    }
}

async function updateTicketStatus(req, res, next){
    try{
        const {id} = req.params;
        const {status} = req.body;

        if(!['open', 'in-progress', 'resolved', 'closed'].includes(status)){
            return res.status(400).json({
                success: false,
                message: "Invalid status provided."
            });
        }

        const ticket = await Ticket.findByIdAndUpdate(
            id,
            {status},
            {new:true, runValidators: true}
        );

        if(!ticket){
            return res.status(404).json({
                success: false,
                message: "Ticket not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: `Ticket status updated to ${status}`,
            data: {ticket}
        });
    }
    catch(err){
        next(err);
    }
}

module.exports = {
    createTicket,
    getTickets,
    getTicketAsset,
    updateTicketStatus
}