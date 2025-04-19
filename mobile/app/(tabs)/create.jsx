import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { toast } from 'sonner-native';
import COLORS from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';

export default function CreatePost() {
  const [postTitle, setPostTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { token } = useAuthStore();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !caption.trim()) {
      toast.error('Post title and caption are required');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('postTitle', postTitle);
      formData.append('caption', caption);

      if (image) {
        const imageFile = {
          uri: image,
          type: 'image/jpeg',
          name: 'post-image.jpg',
        };
        formData.append('postFile', imageFile);
      }

      const response = await fetch(
        'http://localhost:3000/api/post/createPost',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      console.log(data.statusCode);
      if (data.statusCode === 201 || data.statusCode === 200) {
        toast.success('Post created successfully!');
        router.replace('/');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Post</Text>
            <Text style={styles.subtitle}>Share Your Moment!</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Post Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Post Title</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name='create-outline'
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder='Enter post title'
                  placeholderTextColor={COLORS.placeholderText}
                  value={postTitle}
                  onChangeText={setPostTitle}
                />
              </View>
            </View>

            {/* Caption */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Caption</Text>
              <View style={[styles.inputContainer, { height: 100 }]}>
                <TextInput
                  style={[
                    styles.input,
                    { height: 90, textAlignVertical: 'top' },
                  ]}
                  placeholder='Write your caption...'
                  placeholderTextColor={COLORS.placeholderText}
                  value={caption}
                  onChangeText={setCaption}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            {/* Image Picker */}
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Ionicons name='image-outline' size={24} color={COLORS.primary} />
              <Text style={styles.imageButtonText}>
                {image ? 'Change Image' : 'Add Image'}
              </Text>
            </TouchableOpacity>

            {image && (
              <View style={styles.imagePreview}>
                <Image
                  source={{ uri: image }}
                  style={styles.previewImage}
                  resizeMode='cover'
                />
                <TouchableOpacity
                  style={styles.removeImage}
                  onPress={() => setImage(null)}>
                  <Ionicons
                    name='close-circle'
                    size={24}
                    color={COLORS.error}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Create Button */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleCreatePost}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color='#fff' />
              ) : (
                <Text style={styles.buttonText}>Create Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        {/* Add bottom padding for scrolling */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 5,
  },
  formContainer: {
    gap: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: COLORS.textDark,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: COLORS.inputBackground,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: 8,
    marginVertical: 10,
  },
  imageButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.primary,
  },
  imagePreview: {
    position: 'relative',
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.inputBackground,
  },
  previewImage: {
    width: '100%',
    height: 300, // Increased height for better preview
    borderRadius: 8,
  },
  removeImage: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
};
