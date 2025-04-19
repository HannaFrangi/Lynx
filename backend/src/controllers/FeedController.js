import Post from '../models/Post.js';
import User from '../models/User.js';

export const getUserFeed = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const { page = 1, limit = 10 } = req.query;

    const currentUser = await User.findById(currentUserId).select('following');
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const followingIds = currentUser.following.map((id) => id.toString());

    const posts = await Post.find({
      $or: [
        { author: currentUserId }, // always include own posts
        {
          author: { $in: followingIds },
          visibility: { $in: ['public', 'followers'] },
        },
      ],
    })
      .populate('author', 'name username ProfilePicURL')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      posts,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPosts: posts.length,
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feed',
      error: error.message,
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find()
      .populate('author', 'name username ProfilePicURL')
      .sort({ createdAt: -1 }) // latest posts first
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Post.countDocuments();

    res.status(200).json({
      success: true,
      posts,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPosts: total,
    });
  } catch (error) {
    console.error('Error fetching all posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all posts',
      error: error.message,
    });
  }
};
