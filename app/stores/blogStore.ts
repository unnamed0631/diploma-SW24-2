import { API_URL } from "@/utils/constants";
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { tokenCache } from "@/utils/cache";

interface Author {
  _id: string;
  username: string;
  image: string;
}

export interface Comment {
  _id: string;
  content: string;
  likes: string[];
  author: Author;
  blogId: string;
  edited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  _id: string;
  image?: string | "";
  title: string;
  content: string;
  description: string;
  author: Author;
  likes: string[];
  views: number;
  comments: string[];
  isBookmarked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Single source of truth for the bookmark ids stored on the device. */
export const BOOKMARKS_STORAGE_KEY = "bookmarkedPosts";

interface BlogState {
  currentUser: User | null;
  posts: Post[];
  getPostById: (id: string) => Promise<Post | undefined>;
  addPost: (postData: {
    title: string;
    content: string;
    image: string | null;
  }) => Promise<Post | null>;
  toggleLike: (postId: string) => Promise<boolean>;
  addComment: (postId: string, content: string) => Promise<Comment | null>;
  likeComment: (postId: string, commentId: string) => void;
  toggleBookmark: (postId: string) => Promise<boolean>;
  hydrateBookmarks: () => Promise<void>;
  setUser: (user: User) => void;
  loadPosts: () => Promise<void>;
  getComments: (postId: string) => Promise<Comment[]>;
  loadingPosts: boolean;
  sendingPost: boolean;
  loadingComments: boolean;
}

const readBookmarkedIds = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch (error) {
    console.error("Error loading bookmarked posts:", error);
    return [];
  }
};

const writeBookmarkedIds = async (ids: string[]) => {
  await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(ids));
};

const withBookmarkFlags = (posts: Post[], ids: string[]): Post[] => {
  const bookmarked = new Set(ids);
  return posts.map((post) => ({
    ...post,
    isBookmarked: bookmarked.has(post._id),
  }));
};

const withToggledLike = (post: Post, userId: string): Post => {
  const likes = post.likes ?? [];
  return {
    ...post,
    likes: likes.includes(userId)
      ? likes.filter((id) => id !== userId)
      : [...likes, userId],
  };
};

interface PendingLike {
  timer: ReturnType<typeof setTimeout>;
  taps: number;
  resolvers: ((ok: boolean) => void)[];
}

export const useBlogStore = create<BlogState>((set, get) => {
  const pendingLikes = new Map<string, PendingLike>();
  let commentLikeDebounceTimer: ReturnType<typeof setTimeout>;

  const sendLikeToServer = async (postId: string): Promise<boolean> => {
    try {
      const accessToken = await tokenCache?.getToken("accessToken");
      if (!accessToken) return false;

      const response = await fetch(`${API_URL}/post/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to update like status:", await response.json());
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error in sendLikeToServer:", error);
      return false;
    }
  };

  const sendCommentLikeToServer = async (postId: string, commentId: string) => {
    try {
      const accessToken = await tokenCache?.getToken("accessToken");
      if (!accessToken) return;

      const response = await fetch(
        `${API_URL}/post/${postId}/comment/${commentId}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        console.error(
          "Failed to update comment like status:",
          await response.json(),
        );
        return;
      }
    } catch (error) {
      console.log("Error in sendCommentLikeToServer:", error);
    }
  };

  return {
    loadingPosts: false,
    sendingPost: false,
    loadingComments: false,
    currentUser: null,
    setUser: (user: User) => set({ currentUser: user }),

    posts: [],

    loadPosts: async () => {
      try {
        set({ loadingPosts: true });
        const response = await fetch(`${API_URL}/post`);
        const data = await response.json();
        const blogs: Post[] = Array.isArray(data?.blogs) ? data.blogs : [];
        const bookmarkedIds = await readBookmarkedIds();
        set({ posts: withBookmarkFlags(blogs, bookmarkedIds) });
      } catch (e) {
        console.log(e);
      } finally {
        set({ loadingPosts: false });
      }
    },

    // Re-reads bookmarks from storage and applies them to the loaded posts.
    hydrateBookmarks: async () => {
      const bookmarkedIds = await readBookmarkedIds();
      set((state) => ({
        posts: withBookmarkFlags(state.posts, bookmarkedIds),
      }));
    },

    getPostById: async (id) => {
      let post = get().posts.find((post) => post._id === id);
      if (!post) {
        const response = await fetch(`${API_URL}/post/${id}`);
        const data = await response.json();
        post = data.blog;
        if (post) {
          const bookmarkedIds = await readBookmarkedIds();
          post = { ...post, isBookmarked: bookmarkedIds.includes(post._id) };
        }
      }
      return post;
    },

    addPost: async (postData) => {
      try {
        set({ sendingPost: true });
        const accessToken = await tokenCache?.getToken("accessToken");
        if (!accessToken) return null;

        const formData = new FormData();
        formData.append("title", postData.title);
        formData.append("content", postData.content);

        if (postData.image) {
          const filename = postData.image.split("/").pop();
          const match = /\.(\w+)$/.exec(filename ?? "");
          const type = match ? `image/${match[1]}` : `image`;
          formData.append("image", {
            uri: postData.image,
            name: filename,
            type,
          } as any);
        }

        const response = await fetch(`${API_URL}/post`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        });

        if (!response.ok) {
          console.log("add post error response", await response.json());
          return null;
          // throw new Error(`Failed to add post: ${response.statusText}`);
        }

        const newPostResponse = await response.json();
        // Server responds with `{ message, data: post }`.
        const newPost: Post = newPostResponse.data ?? newPostResponse;
        set((state) => ({
          posts: [newPost, ...state.posts],
        }));
        return newPost;
      } catch (error) {
        console.error("Error in addPost:", error);
        throw error;
      } finally {
        set({ sendingPost: false });
      }
    },

    // like post
    // Optimistically flips the like, then reconciles with the server. Repeated
    // taps are coalesced: an even number of taps means the server state should
    // not change, an odd one means a single toggle request is sent.
    toggleLike: (postId: string) => {
      const userId = get().currentUser?._id;
      if (!userId) return Promise.resolve(false);

      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId ? withToggledLike(post, userId) : post,
        ),
      }));

      const existing = pendingLikes.get(postId);
      if (existing) clearTimeout(existing.timer);

      const taps = (existing?.taps ?? 0) + 1;
      const resolvers = existing?.resolvers ?? [];

      const promise = new Promise<boolean>((resolve) => {
        resolvers.push(resolve);
      });

      const timer = setTimeout(async () => {
        pendingLikes.delete(postId);
        const shouldToggle = taps % 2 === 1;
        let ok = true;

        if (shouldToggle) {
          ok = await sendLikeToServer(postId);
          if (!ok) {
            const currentUserId = get().currentUser?._id;
            if (currentUserId) {
              set((state) => ({
                posts: state.posts.map((post) =>
                  post._id === postId
                    ? withToggledLike(post, currentUserId)
                    : post,
                ),
              }));
            }
          }
        }

        resolvers.forEach((resolve) => resolve(ok));
      }, 500);

      pendingLikes.set(postId, { timer, taps, resolvers });
      return promise;
    },

    // like comment
    likeComment: (postId: string, commentId: string) => {
      clearTimeout(commentLikeDebounceTimer);
      commentLikeDebounceTimer = setTimeout(() => {
        sendCommentLikeToServer(postId, commentId);
      }, 500);
    },

    addComment: async (postId, content) => {
      try {
        const accessToken = await tokenCache?.getToken("accessToken");
        if (!accessToken) return null;

        const response = await fetch(`${API_URL}/post/${postId}/comment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ content, postId }),
        });

        if (!response.ok) {
          throw new Error(`Failed to add comment: ${response.statusText}`);
        }

        const newComment = (await response.json()) as Comment;
        set((state) => ({
          posts: state.posts.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  comments: [...(post.comments ?? []), newComment._id],
                }
              : post,
          ),
        }));
        return newComment;
      } catch (error) {
        console.error("Error in addComment:", error);
        throw error;
      }
    },

    // Bookmarks are device-local, so this writes straight through to storage
    // and mirrors the result on the matching post.
    toggleBookmark: async (postId) => {
      const bookmarkedIds = await readBookmarkedIds();
      const isBookmarked = !bookmarkedIds.includes(postId);
      const nextIds = isBookmarked
        ? [...bookmarkedIds, postId]
        : bookmarkedIds.filter((id) => id !== postId);
      const previous = get().posts.find(
        (post) => post._id === postId,
      )?.isBookmarked;

      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId ? { ...post, isBookmarked } : post,
        ),
      }));

      try {
        await writeBookmarkedIds(nextIds);
        return isBookmarked;
      } catch (error) {
        console.error("Error in toggleBookmark:", error);
        const restored = previous ?? !isBookmarked;
        set((state) => ({
          posts: state.posts.map((post) =>
            post._id === postId ? { ...post, isBookmarked: restored } : post,
          ),
        }));
        return restored;
      }
    },

    getComments: async (postId: string) => {
      set({ loadingComments: true });
      try {
        const response = await fetch(`${API_URL}/post/${postId}/comments`);
        const data = await response.json();
        return Array.isArray(data) ? (data as Comment[]) : [];
      } catch (error) {
        console.error("Error in getComments:", error);
        return [] as Comment[];
      } finally {
        set({ loadingComments: false });
      }
    },
  };
});
