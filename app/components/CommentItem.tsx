import { View, Text, Pressable } from "react-native";
import { formatDistanceToNow } from "date-fns";
import { Heart } from "lucide-react-native";
import { useBlogStore, Comment } from "@/stores/blogStore";
import { useAppTheme } from "@/lib/theme";
import { useState } from "react";
import { Avatar } from "@/components";
interface CommentItemProps {
  comment: Comment;
}

export default function CommentItem({ comment }: CommentItemProps) {
  const { currentUser, likeComment } = useBlogStore();
  const { colors } = useAppTheme();
  const [isLiked, setIsLiked] = useState(
    comment.likes?.includes(currentUser?._id ?? ""),
  );

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
  });

  const toggleLike = () => {
    likeComment(comment.blogId, comment._id);
    if (isLiked) {
      setIsLiked(false);
    } else {
      setIsLiked(true);
    }
  };

  return (
    <View className="mb-4 p-2 border-b border-border">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Avatar image={comment.author.image} size={40} />
          <View className="ml-2">
            <View className="flex-row items-center mb-1">
              <Text className="font-bold text-foreground mr-2">
                {comment.author.username}
              </Text>
            </View>
            <Text className="text-subtle text-xs">{timeAgo}</Text>
          </View>
        </View>
        <View className="flex-row items-center mt-1 ml-1">
          <Pressable onPress={toggleLike}>
            <Heart
              size={14}
              color={isLiked ? colors.accent : colors.subtle}
              fill={isLiked ? colors.accent : "transparent"}
            />
            <Text className="ml-1 text-xs text-subtle">
              {comment.likes?.length > 0 ? comment.likes?.length : ""}
            </Text>
          </Pressable>
        </View>
      </View>
      <View className="flex-1">
        <View className="rounded-lg p-3">
          <Text className="text-muted-foreground">{comment.content}</Text>
        </View>
      </View>
    </View>
  );
}
