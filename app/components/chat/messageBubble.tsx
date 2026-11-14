import { useEffect, useState, memo, use } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { AuthContext } from "@/context/auth";
import { useAppTheme } from "@/lib/theme";

const TYPING_SPEED_MS = 1;

const MessageBubbleComponent = memo(
  ({
    message,
    isCurrentlyStreaming,
    setCurrentStreamingMessageId,
    isSending,
  }: {
    message: Message;
    isCurrentlyStreaming: boolean;
    setCurrentStreamingMessageId: (id: string | null) => void;
    isSending: boolean;
  }) => {
    const isUser = message.role === "user";
    const { user } = use(AuthContext);
    const { colors } = useAppTheme();

    const [displayedText, setDisplayedText] = useState(() => {
      if (isUser || (message.role === "model" && !isCurrentlyStreaming)) {
        return message.content;
      }
      return "";
    });

    useEffect(() => {
      if (isUser) {
        if (message.content !== displayedText) {
          setDisplayedText(message.content);
        }
        return;
      }

      // if (isCurrentlyStreaming) {
      // if (
      //   !message.content.startsWith(displayedText) &&
      //   displayedText !== ""
      // ) {
      //   setDisplayedText(message.content);
      //   setCurrentStreamingMessageId(null);
      //   return;
      // }

      if (displayedText.length < message.content.length) {
        const timer = setTimeout(() => {
          setDisplayedText(
            message.content.substring(0, displayedText.length + 10),
          );
        }, TYPING_SPEED_MS);
        return () => clearTimeout(timer);
      }
      // }
    }, [
      message.content,
      isUser,
      isCurrentlyStreaming,
      displayedText,
      setCurrentStreamingMessageId,
    ]);

    const avatarSource = isUser
      ? user?.image
        ? { uri: user.image }
        : require("@/assets/img/profile.png")
      : require("@/assets/bluviSignup.png");

    return (
      <View
        className={`${
          isUser ? "flex-row-reverse" : "flex-row"
        } items-start mb-4 justify-start gap-2`}
      >
        <View className="w-[12%] aspect-square rounded-full bg-muted overflow-hidden">
          <Image
            source={avatarSource}
            style={{ width: "100%", height: "100%" }}
            transition={700}
            cachePolicy="memory"
            focusable={false}
            contentFit="fill"
          />
        </View>
        <View
          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
            isUser
              ? "bg-primary rounded-tr-none border-r-4 border-r-primary"
              : "bg-muted rounded-tl-none border-l-4 border-l-border"
          }`}
        >
          {isUser ? (
            <Text className={`text-base text-primary-foreground`}>
              {message.content}
            </Text>
          ) : (
            <View className="flex-row items-center gap-2">
              {isSending ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <Text className="text-base text-foreground">
                  {displayedText}
                </Text>
              )}
            </View>
          )}
          <Text
            className={`text-xs mt-1 ${
              isUser ? "text-primary-foreground/70" : "text-subtle"
            }`}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          {/* notch */}
        </View>
      </View>
    );
  },
);

MessageBubbleComponent.displayName = "MessageBubble";

export default MessageBubbleComponent;
