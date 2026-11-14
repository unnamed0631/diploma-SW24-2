import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Share as NativeShare,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, use } from "react";
import { Post, useBlogStore, Comment } from "@/stores/blogStore";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share,
  Bookmark,
} from "lucide-react-native";
import CommentItem from "@/components/CommentItem";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Avatar, ThemeText } from "@/components";
import { AuthContext } from "@/context/auth";
import { useAppTheme } from "@/lib/theme";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const postId = Array.isArray(id) ? id[0] : (id as string | undefined);
  const { user: authUser } = use(AuthContext);
  const {
    getPostById,
    currentUser,
    setUser,
    toggleLike,
    addComment,
    toggleBookmark,
    getComments,
    loadingComments,
  } = useBlogStore();
  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(Boolean(postId));
  // Optimistic overrides for the like UI; null means "use the post's data".
  const [likedOverride, setLikedOverride] = useState<boolean | null>(null);
  const [likeCountOverride, setLikeCountOverride] = useState<number | null>(
    null,
  );
  // user comment that is being typed
  const [comment, setComment] = useState("");
  // comments of the post
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppTheme();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const viewer = currentUser ?? authUser;

  // Reading a post is public; only the interactive actions require a user.
  // Make sure the store knows about the logged-in user for likes/comments.
  useEffect(() => {
    if (authUser && !currentUser) setUser(authUser);
  }, [authUser, currentUser, setUser]);

  useEffect(() => {
    if (!postId) return;

    let cancelled = false;

    (async () => {
      setLoadingPost(true);
      setLikedOverride(null);
      setLikeCountOverride(null);
      try {
        const fetchedPost = await getPostById(postId);
        if (cancelled) return;
        setPost(fetchedPost ?? null);
        setIsBookmarked(fetchedPost?.isBookmarked ?? false);
      } catch (error) {
        console.error("Error loading post:", error);
        if (!cancelled) setPost(null);
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    })();

    (async () => {
      setComments([]);
      setCommentsLoaded(false);
      const fetchedComments = await getComments(postId);
      if (cancelled) return;
      setComments(fetchedComments);
      setCommentsLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [postId, getPostById, getComments]);

  const serverLiked = post?.likes?.includes(viewer?._id ?? "") ?? false;
  const isLiked = likedOverride ?? serverLiked;
  const likeCount = likeCountOverride ?? post?.likes?.length ?? 0;

  const promptLogin = () =>
    Alert.alert(
      "Login required",
      "Please log in to like, comment on or bookmark posts.",
    );

  const handleLike = async () => {
    if (!post) return;
    if (!viewer) {
      promptLogin();
      return;
    }

    const previousIsLiked = isLiked;
    const previousCount = likeCount;

    // optimistic flip, reverted below if the server rejects the change
    setLikedOverride(!previousIsLiked);
    setLikeCountOverride(
      Math.max(0, previousCount + (previousIsLiked ? -1 : 1)),
    );

    const ok = await toggleLike(post._id);
    if (!ok) {
      setLikedOverride(previousIsLiked);
      setLikeCountOverride(previousCount);
      Alert.alert(
        "Couldn't update like",
        "Please check your connection and try again.",
      );
    }
  };

  const handleBookmark = async () => {
    if (!post) return;
    if (!viewer) {
      promptLogin();
      return;
    }

    const previous = isBookmarked;
    setIsBookmarked(!previous);
    const next = await toggleBookmark(post._id);
    setIsBookmarked(next);

    if (next === previous) {
      Alert.alert("Couldn't update bookmark", "Please try again.");
    }
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      await NativeShare.share({
        title: post.title,
        message: `${post.title}\n\n${post.content}`,
      });
    } catch (error) {
      console.warn("Error sharing post:", error);
    }
  };

  const handleComment = async () => {
    if (!post) return;
    if (!viewer) {
      promptLogin();
      return;
    }

    const content = comment.trim();
    if (!content || sendingComment) return;

    setSendingComment(true);
    try {
      const created = await addComment(post._id, content);
      if (!created) throw new Error("Comment was not created");
      setComment("");
      // Re-fetch so the new comment comes back with its populated author.
      const refreshedComments = await getComments(post._id);
      setComments(refreshedComments);
      setCommentsLoaded(true);
    } catch {
      Alert.alert("Couldn't post comment", "Please try again.");
    } finally {
      setSendingComment(false);
    }
  };

  if (loadingPost) {
    return (
      <View
        className="flex-1 justify-center items-center bg-background"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View
        className="flex-1 justify-center items-center bg-background"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-subtle">Post not found</Text>
      </View>
    );
  }

  const commentCount = commentsLoaded
    ? comments.length
    : (post.comments?.length ?? 0);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background p-6"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      style={{ paddingTop: insets.top }}
    >
      <View className="p-4 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-xl font-bold text-foreground">Post</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          <View className="border border-border rounded-3xl p-7 bg-card">
            <View className="flex-row items-center mb-3 gap-3">
              <Avatar image={post.author?.image} size={40} />
              <View>
                <Text className="font-bold text-foreground">
                  {post.author?.username}
                </Text>
                <Text className="text-subtle text-xs">
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })}
                </Text>
              </View>
            </View>

            <Text className="text-xl font-bold text-foreground mb-2">
              {post.title}
            </Text>
            <Text className="text-base text-muted-foreground mb-4 leading-6">
              {post.content}
            </Text>

            {post.image && (
              <Image
                source={{ uri: post.image }}
                className="w-full aspect-video rounded-lg mb-4"
                resizeMode="cover"
              />
            )}

            <View className="flex-row justify-between items-center py-3">
              <Pressable
                className="flex-row items-center"
                onPress={handleLike}
                accessibilityLabel="Like post"
              >
                <Heart
                  size={20}
                  color={isLiked ? colors.accent : colors.mutedForeground}
                  fill={isLiked ? colors.accent : "transparent"}
                />
                <Text className="ml-1 text-muted-foreground">{likeCount}</Text>
              </Pressable>

              <View className="flex-row items-center">
                <MessageCircle size={20} color={colors.mutedForeground} />
                <Text className="ml-1 text-muted-foreground">
                  {commentCount}
                </Text>
              </View>

              <Pressable
                className="flex-row items-center"
                onPress={handleShare}
                accessibilityLabel="Share post"
              >
                <Share size={20} color={colors.mutedForeground} />
              </Pressable>

              <Pressable
                onPress={handleBookmark}
                accessibilityLabel="Bookmark post"
                accessibilityState={{ selected: isBookmarked }}
              >
                <Bookmark
                  size={20}
                  color={isBookmarked ? colors.primary : colors.mutedForeground}
                  fill={isBookmarked ? colors.primary : "transparent"}
                />
              </Pressable>
            </View>
          </View>

          <Text className="font-bold text-foreground mt-4 mb-2">
            Comments ({commentCount})
          </Text>

          {loadingComments && comments.length === 0 ? (
            <View className="py-6 items-center">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : comments.length === 0 ? (
            <View className="py-6 items-center">
              <Text className="text-subtle">
                No comments yet — be the first
              </Text>
            </View>
          ) : (
            comments.map((item) => (
              <Animated.View
                key={item._id}
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(300)}
              >
                <CommentItem comment={item} />
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>

      <View className="p-4 bottom-7 flex-row bg-background">
        {viewer && <Avatar image={viewer.image} size={32} />}
        <TextInput
          className="flex-1 bg-muted rounded-full px-4 py-2 mr-2 ml-3 text-foreground"
          placeholder={viewer ? "Add a comment..." : "Log in to comment"}
          placeholderTextColor={colors.subtle}
          value={comment}
          onChangeText={setComment}
          editable={!sendingComment}
        />
        <Pressable
          className={`justify-center px-4 ${
            !comment.trim() ? "opacity-50" : ""
          }`}
          onPress={handleComment}
          disabled={!comment.trim() || sendingComment}
        >
          <ThemeText className="text-primary font-bold ">Post</ThemeText>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
