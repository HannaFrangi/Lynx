import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const PAGE_LIMIT = 10;

export default function PostsScreen() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { token, user } = useAuthStore();
  const currentUserId = user?._id;

  const router = useRouter();

  const fetchPosts = useCallback(
    async (pageNumber = 1) => {
      if (!token) return;
      try {
        if (pageNumber === 1) setLoading(true);
        const res = await fetch(
          `http://localhost:3000/api/feed/getFeed?page=${pageNumber}&limit=${PAGE_LIMIT}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch posts');
        }
        setPosts((prev) =>
          pageNumber === 1 ? data.posts : [...prev, ...data.posts]
        );
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error(error.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const handleLoadMore = () => {
    if (!loading) setPage((prev) => prev + 1);
  };

  useEffect(() => {
    if (page > 1) fetchPosts(page);
  }, [page, fetchPosts]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchPosts(1);
  };

  const handleLikes = async (postId) => {
    if (!currentUserId) return;
    // Optimistic update
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post._id === postId) {
          const hasLiked = post.likes.includes(currentUserId);
          const updatedLikes = hasLiked
            ? post.likes.filter((id) => id !== currentUserId)
            : [...post.likes, currentUserId];
          return { ...post, likes: updatedLikes };
        }
        return post;
      })
    );
    try {
      const res = await fetch(
        `http://localhost:3000/api/post/likePost/${postId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error(error.message);
      // Revert on failure
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            const hasLiked = post.likes.includes(currentUserId);
            const revertedLikes = hasLiked
              ? post.likes.filter((id) => id !== currentUserId)
              : [...post.likes, currentUserId];
            return { ...post, likes: revertedLikes };
          }
          return post;
        })
      );
    }
  };

  const renderPost = ({ item }) => {
    const hasLiked = currentUserId && item.likes.includes(currentUserId);
    return (
      <View style={styles.postContainer}>
        <View style={styles.authorContainer}>
          {item.author?.ProfilePicURL ? (
            <ExpoImage
              source={item.author.ProfilePicURL}
              style={styles.profileImage}
              cachePolicy='memory-disk'
              contentFit='cover'
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Ionicons name='person' size={24} color={COLORS.primary} />
            </View>
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>
              {item.author?.name || 'Unknown'}
            </Text>
            <Text style={styles.username}>
              @{item.author?.username || 'unknown'}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {item.caption ? (
          <Text style={styles.caption}>{item.caption}</Text>
        ) : null}
        {item.FileURL ? (
          <View style={styles.postImageContainer}>
            <ExpoImage
              source={item.FileURL}
              style={styles.postImage}
              cachePolicy='memory-disk'
              contentFit='cover'
            />
          </View>
        ) : null}
        <View style={styles.interactionContainer}>
          <TouchableOpacity
            style={styles.interactionButton}
            onPress={() => handleLikes(item._id)}>
            <Ionicons
              name={hasLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={hasLiked ? COLORS.danger : COLORS.primary}
            />
            <Text style={styles.interactionText}>{item.likes.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.interactionButton}
            onPress={() => router.push(`/post/${item._id}`)}>
            <Ionicons
              name='chatbubble-outline'
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.interactionText}>{item.replies.length}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  if (loading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContainer}
      style={{ backgroundColor: COLORS.background }}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading && page > 1 ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[COLORS.primary]}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  listContainer: { padding: 15 },
  postContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  authorInfo: { flexDirection: 'column' },
  authorName: { fontWeight: 'bold', fontSize: 16 },
  username: { color: COLORS.gray, fontSize: 14 },
  timestamp: { marginLeft: 'auto', color: COLORS.gray, fontSize: 12 },
  caption: { fontSize: 16, marginBottom: 12 },
  postImageContainer: {
    width: '100%',
    height: (width - 30) * 0.6,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  interactionContainer: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  interactionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  interactionText: { color: COLORS.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
