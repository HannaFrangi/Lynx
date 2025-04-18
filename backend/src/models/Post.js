import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 280,
    },
    FileURL: {
      type: String,
      default: '',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reply',
      },
    ],
    isReply: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    repostedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    visibility: {
      type: String,
      enum: ['public', 'private', 'followers'],
      default: 'public',
    },

    hashtags: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      default: '',
    },
    views: {
      type: Number,
      default: 0,
    },
    viewedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    poll: {
      question: { type: String, default: '' },
      options: [
        {
          option: { type: String },
          votes: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
          ],
        },
      ],
    },

    EditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);
export default Post;
