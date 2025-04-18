import User from '../models/User.js';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../config/firebase.js';

export const followUnfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const { userIdToFollow } = req.params;

    if (currentUserId === userIdToFollow.toString()) {
      return res.status(400).json({
        success: false,
        message: "You can't follow yourself.",
      });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userIdToFollow);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User to follow not found.',
      });
    }

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === userIdToFollow.toString()
    );

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== userIdToFollow.toString()
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId
      );
    } else {
      // Follow
      currentUser.following.push(userIdToFollow);
      targetUser.followers.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: isFollowing
        ? 'User unfollowed successfully'
        : 'User followed successfully',
      isFollowing: !isFollowing,
      yourFollowingCount: currentUser.following.length,
      targetFollowersCount: targetUser.followers.length,
    });
  } catch (error) {
    console.error('Error in follow/unfollow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export const getUserFollowList = async (req, res) => {
  try {
    const { userId, type } = req.params;

    if (!['followers', 'following'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Use "followers" or "following".',
      });
    }

    const user = await User.findById(userId).populate(
      type,
      'name username ProfilePicURL'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      [type]: user[type],
      count: user[type].length,
    });
  } catch (error) {
    console.error('Error fetching follow list:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, bio, location, website } = req.body; // Expanded to handle more fields
    const updateFields = {};

    // Update fields if they're provided in the request body
    if (name) updateFields.name = name;
    if (bio) updateFields.bio = bio;
    if (location) updateFields.location = location;
    if (website) updateFields.website = website;

    // Handle profile picture update
    if (req.file) {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          StatusCode: 404,
          message: 'User not found',
        });
      }

      // Delete the existing profile picture from Firebase Storage if one exists
      if (user.ProfilePicURL) {
        const oldPicRef = ref(storage, user.ProfilePicURL);
        await deleteObject(oldPicRef);
      }

      // Generate a consistent filename using the user's MongoDB _id
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `${req.user._id}.${fileExtension}`;

      const metadata = {
        contentType: req.file.mimetype,
        customMetadata: {
          userId: req.user._id.toString(),
        },
      };

      // Create storage reference with the user's ID as the filename
      const storageRef = ref(storage, `profilePics/${fileName}`);

      // Upload the file to Firebase Storage
      const snapshot = await uploadBytes(storageRef, req.file.buffer, metadata);

      // Get the download URL for the uploaded image
      const downloadURL = await getDownloadURL(
        ref(storage, snapshot.metadata.fullPath)
      );

      // Add the new profile picture URL to the updateFields object
      updateFields.ProfilePicURL = downloadURL;
    }

    // Update the user in the database with the new fields
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Return the updated user profile info
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        ProfilePicURL: updatedUser.ProfilePicURL,
        bio: updatedUser.bio,
        location: updatedUser.location,
        website: updatedUser.website,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message,
    });
  }
};
