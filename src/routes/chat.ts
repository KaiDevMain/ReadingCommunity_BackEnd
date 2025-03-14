import express from 'express';
import { Router, Request, RequestHandler,  Response } from 'express';
import { Channel } from '../models/Chat.js';
import { Server, Socket } from 'socket.io';

interface User {
  id?: string | null;
  name?:  string | null;
  email?: string | null;
  photo?: string | null;
}
interface ChatMessage {
  message: string;
  user: User | null;
  createdAt: Date;
}


const chatRouter = (io: Server): Router => {
  const router = express.Router();

  router.get('/', async (req, res) => {
      try {
        const channels = await Channel.find().sort({ createdAt: -1 });
        res.json(channels)
      } catch(error) {
        res.status(500).json({ message: 'エラーです' + error })
      }
  });

  router.get('/:channelId/messages', async (req, res): Promise<void>  => {
    try {
      const channel = await Channel.findById(req.params.channelId);
      if (!channel) {
        res.status(404).json({ message: 'チャンネルがありません' });
        return
      }

      const messages = channel.messages.map((msg) => {
        const plainMsg = msg.toObject() as ChatMessage;
        return {
          message: plainMsg.message,
          user: plainMsg.user,
          createdAt: plainMsg.createdAt,
        };
      });

      res.status(200).json({
        channelId: channel._id,
        messages: messages
      });
    } catch (error) {
      res.status(500).json({ message: 'エラーです: ' + error });
    }
  });

  router.post('/', async (req, res) => {
      try {
        const { channelName} = req.body;
        const newChannel = new Channel({channelName});
        await newChannel.save();
        io.emit('channelAdded_socket', {
          _id: newChannel._id,
          channelName: newChannel.channelName,
          createdAt: newChannel.createdAt,
        });
  
        res.status(201).json({
          _id: newChannel._id,
          channelName: newChannel.channelName,
          createdAt: newChannel.createdAt,
        });
      } catch (error) {
        res.status(500).json({ message: 'エラーです' + error });
      }
    });

    router.post('/:channelId/messages',
      (async (req: Request<{ channelId: string },any,{ message: string; user: string; }>,res) => {
        try {
          const { message, user } = req.body;
          const channel = await Channel.findById(req.params.channelId);
          if (!channel) {
            return res.status(404).json({ message: 'チャンネルがありません' });
          }
          const newMessage = { message, user, createdAt: new Date()};
          channel.messages.push( newMessage );
          await channel.save();

          const updatedChannel = await Channel.findById(req.params.channelId);
          if (!updatedChannel) {
            return res.status(404).json({ message: 'チャンネルが見つかりません（更新後）' });
          }
          const savedMessage = channel.messages[channel.messages.length - 1];
          io.emit('newMessage_socket', { channelId: channel._id, message: savedMessage });          

          res.status(201).json(newMessage);
        } catch (error) {
          res.status(500).json({ message: 'エラーです' + error });
        }
      }) as RequestHandler<
        { channelId: string },
        any,
        { message: string; user: string }
      >
    );
  return router;
}
export default chatRouter;