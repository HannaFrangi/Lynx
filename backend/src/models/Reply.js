import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    caption: {
      type: String,
      required: true,
      trim: true,
      maxlength: 280,
    },
    isReply: {
      type: Boolean,
      default: true,
    },
    replyToPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

const Reply = mongoose.model('Reply', replySchema);
export default Reply;
