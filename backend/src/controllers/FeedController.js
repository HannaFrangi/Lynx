import Post from '../models/Post.js';
import User from '../models/User.js';

export const getUserFeed = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { page = 1, limit = 10 } = req.query; // Pagination parameters

    // Step 1: Get the list of users the current user follows
    const currentUser = await User.findById(currentUserId).populate(
      'following'
    );
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Get an array of user IDs from the 'following' field
    const followingIds = currentUser.following.map((user) => user._id);

    // Step 2: Fetch posts from users they follow
    const posts = await Post.find({
      author: { $in: followingIds }, // Only posts from followed users
      visibility: { $in: ['public', 'followers'] }, // Only public or followers-only posts
    })
      .populate('author', 'name username ProfilePicURL') // Include author details
      .sort({ createdAt: -1 }) // Latest posts first
      .skip((page - 1) * limit) // Pagination: skip previous pages
      .limit(limit); // Limit the number of posts per page

    // Step 3: Return the posts
    res.status(200).json({
      success: true,
      posts,
      page,
      limit,
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
