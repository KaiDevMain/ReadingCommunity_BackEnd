import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    user: {
        email: String,
        id: String,
        name: String,
        photo: String
    },
}, { timestamps: true });
const channelSchema = new mongoose.Schema({
    channelName: {
        type: String,
        required: true
    },
    messages: [messageSchema],
}, { timestamps: true });
export const Channel = mongoose.model('Channel', channelSchema);
