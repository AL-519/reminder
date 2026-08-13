const personalReminder = require('../models/personal-reminder.model');

async function createPersonalReminder(req, res, next) {
    try{
        const { customName, notes, endTime } = req.body;
        const userId = req.user.id; //check, authMiddleware not called

        if(!customName || !endTime){
            return res.status(400).json({
                success: false,
                message: "Reminder name and endtime are required."
            });
        }

        const reminder = await personalReminder.create({
            userId,
            customName,
            notes,
            endTime
        });

        return res.status(201).json({
            success: true,
            message: "Personal reminder created successfully.",
            data: {reminder}
        });
    }
    catch(err){
        next(err);
    }
}

async function getPersonalReminders(req, res, next){
    try{
        const  userId = req.user.id;

        const reminders = await personalReminder.find({userId}).sort({endTime: 1});

        return res.status(200).json({
            success: true,
            message: "Personal reminders fetched successfully.",
            data:{
                count: reminders.length,
                reminders
            }
        });
    }
    catch(err){
        next(err);
    }
}

async function updatePersonalReminder(req, res, next){
    try{
        const { id } = req.params;
        const { customName, notes, endTime } = req.body;
        const userId = req.user.id;

        const reminder = await personalReminder.findOne({_id: id, userId});
        if(!reminder){
            return res.status(404).json({
                success: false,
                message:"Personal reminder not found or unauthorized access."
            });
        }

        if(customName !== undefined) reminder.customName = customName;
        if(notes !== undefined) reminder.notes = notes;
        if(endTime !== undefined) reminder.endTime = endTime;

        await reminder.save();

        return res.status(200).json({
            success: true,
            message: "Personal reminder updated successfully.",
            data: {reminder}
        });
    }
    catch(err){
        next(err);
    }
}

async function deletePersonalReminder(req, res, next){
    try{
        const {id} = req.params;
        const userId = req.user.id;

        const reminder = await personalReminder.findOneAndDelete({_id: id, userId});
         if(!reminder){
            return res.status(404).json({
                success: false,
                message:"Personal reminder not found."
            });
         }

         return res.status(200).json({
            success: true,
            message: "Personal reminder deleted successfully."
         });
    }
    catch(err){
        next(err);
    }
}

module.exports = { createPersonalReminder, getPersonalReminders, updatePersonalReminder, deletePersonalReminder }