import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Reply from '../models/Reply.js';

export const getPostById = async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId)
      .populate('author', 'name profilePicture')
      .populate('likes', 'name profilePicture')
      .populate('replies', 'caption author')
      .populate('replies.author', 'name profilePicture')
      .populate('replies.likes', 'name profilePicture')
      .populate('replies.replyToPost', 'caption author')
      .populate('replies.replyToPost.author', 'name profilePicture');
    if (!post) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Post not found',
      });
    }
    res.status(200).json({
      statusCode: 200,
      message: 'Post retrieved successfully',
      post,
    });
  } catch (error) {
    console.error('Error retrieving post:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error retrieving post',
      error: error.message,
    });
  }
};

export const createPost = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const { postTitle, caption } = req.body;
    if (!postTitle || !caption) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Post title and caption are required.',
      });
    }

    const postData = { postTitle, caption, author: req.user._id };

    if (req.file) {
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `${req.user._id}_${Date.now()}.${fileExtension}`;

      const metadata = {
        contentType: req.file.mimetype,
        customMetadata: {
          userId: req.user._id.toString(),
          postTitle: postData.postTitle,
        },
      };

      const storageRef = ref(storage, `posts/${fileName}`);
      const snapshot = await uploadBytes(storageRef, req.file.buffer, metadata);
      const downloadURL = await getDownloadURL(
        ref(storage, snapshot.metadata.fullPath)
      );

      postData.FileURL = downloadURL;
    }

    const newPost = await Post.create(postData);
    if (!newPost) {
      return res.status(500).json({
        statusCode: 500,
        message: 'Failed to create post',
      });
    }

    // Update the user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { posts: newPost._id },
    });

    res.status(201).json({
      statusCode: 201,
      message: 'Post created successfully',
      post: newPost,
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Error creating post',
      error: error.message,
    });
  }
};

export const trackPostView = async (req, res) => {
  try {
    const { postId } = req.params;
    console.log(req.user);
    // Ensure the user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    // Find the post by its ID
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    // Check if the user has already viewed this post
    if (post.viewedBy.includes(req.user._id)) {
      return res.status(200).json({
        success: false,
        message: 'You have already viewed this post.',
        views: post.views, // Return current view count
      });
    }

    // Increment the views count
    post.views += 1;

    // Add the user's ID to the viewedBy array
    post.viewedBy.push(req.user._id);

    // Save the updated post
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post view tracked successfully.',
      views: post.views,
    });
  } catch (error) {
    console.error('Error tracking post view:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking post view',
      error: error.message,
    });
  }
};

export const editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { caption, FileURL, visibility } = req.body;

    // Check if the user is authenticated and is the author of the post
    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: 'You can only edit your own posts' });
    }

    // Update post data
    post.caption = caption || post.caption;
    post.FileURL = FileURL || post.FileURL;
    post.visibility = visibility || post.visibility;
    post.EditedBy = req.user._id; // Set the EditedBy field to the current user

    // Save the updated post
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post,
    });
  } catch (error) {
    console.error('Error editing post:', error);
    res.status(500).json({
      success: false,
      message: 'Error editing post',
      error: error.message,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.postId;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this post',
      });
    }

    await post.deleteOne();

    // Optional: Remove post from user's post array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { posts: post._id },
    });

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message,
    });
  }
};

export const likePost = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const { postId } = req.params;
    const userId = req.user._id;

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    let liked;

    // Toggle like/unlike
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      user.likedPosts = user.likedPosts.filter(
        (id) => id.toString() !== postId.toString()
      );
      liked = false;
    } else {
      post.likes.push(userId);
      user.likedPosts.push(postId);
      liked = true;
    }

    // Save changes
    await post.save();
    await user.save();

    res.status(200).json({
      statusCode: 200,
      success: true,
      message: liked ? 'Post liked successfully' : 'Post unliked successfully',
      liked,
      likesCount: post.likes.length,
      postId: post._id,
    });
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: 'Error liking/unliking post',
      error: error.message,
    });
  }
};

export const replyToPost = async (req, res) => {
  try {
    // Ensure the user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const { postId } = req.params; // ID of the post being replied to
    const { caption } = req.body; // The reply text

    if (!caption) {
      return res.status(400).json({
        success: false,
        message: 'Caption is required for reply.',
      });
    }

    // Find the original post that is being replied to
    const originalPost = await Post.findById(postId);
    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'Original post not found.',
      });
    }

    // Create a new reply for the post
    const reply = new Reply({
      author: req.user._id,
      caption,
      replyToPost: postId, // Reference to the original post
    });

    // Save the reply
    await reply.save();

    // Add the reply to the original post's replies array
    originalPost.replies.push(reply._id);
    await originalPost.save();

    res.status(201).json({
      success: true,
      message: 'Reply posted successfully.',
      reply,
    });
  } catch (error) {
    console.error('Error replying to post:', error);
    res.status(500).json({
      success: false,
      message: 'Error replying to post',
      error: error.message,
    });
  }
};

export const editReply = async (req, res) => {
  try {
    // Ensure the user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const { replyId } = req.params; // Reply ID
    const { caption } = req.body; // New caption for the reply

    if (!caption) {
      return res.status(400).json({
        success: false,
        message: 'Caption is required for editing the reply.',
      });
    }

    // Find the reply to be edited
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found.',
      });
    }

    // Check if the user is the author of the reply
    if (reply.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own replies.',
      });
    }

    // Update the reply
    reply.caption = caption;
    await reply.save();

    res.status(200).json({
      success: true,
      message: 'Reply updated successfully.',
      reply,
    });
  } catch (error) {
    console.error('Error editing reply:', error);
    res.status(500).json({
      success: false,
      message: 'Error editing reply',
      error: error.message,
    });
  }
};

export const deleteReply = async (req, res) => {
  try {
    // Ensure the user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const { replyId } = req.params; // Reply ID to be deleted

    // Find the reply to be deleted
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found.',
      });
    }

    // Check if the user is the author of the reply
    if (reply.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own replies.',
      });
    }

    // Remove the reply from the Post's replies array
    const post = await Post.findById(reply.replyToPost);
    post.replies = post.replies.filter((id) => id.toString() !== replyId);
    await post.save();

    // Delete the reply
    await reply.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Reply deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting reply',
      error: error.message,
    });
  }
};
