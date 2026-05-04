import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import { queryFetch } from "./queryFetch";
import { apiFetch } from "../../utils/apiFetch";
import { useAuthUser } from "../useAuthUser";
import type { Movie, Show } from "../../types/calendar";

interface ListData {
  movies: Movie[];
  shows: Show[];
}

export function useWatchlist(enabled = true) {
  const user = useAuthUser();
  return useQuery({
    queryKey: queryKeys.watchlist(user?.uid ?? ""),
    queryFn: () => queryFetch<ListData>("/watchlist"),
    enabled: !!user && enabled,
  });
}

export function useWatched(enabled = true) {
  const user = useAuthUser();
  return useQuery({
    queryKey: queryKeys.watched(user?.uid ?? ""),
    queryFn: () => queryFetch<ListData>("/watched"),
    enabled: !!user && enabled,
  });
}

export function useCurrentlyWatching() {
  const user = useAuthUser();
  return useQuery({
    queryKey: queryKeys.currentlyWatching(user?.uid ?? ""),
    queryFn: () => queryFetch<ListData>("/currently-watching"),
    enabled: !!user,
  });
}

export function useFavorites() {
  const user = useAuthUser();
  return useQuery({
    queryKey: queryKeys.favorites(user?.uid ?? ""),
    queryFn: () => queryFetch<ListData>("/favorites"),
    enabled: !!user,
  });
}

export function useFavoriteStatus(contentType: string, contentId: number) {
  const user = useAuthUser();
  return useQuery({
    queryKey: queryKeys.favoriteStatus(user?.uid ?? "", contentType, contentId),
    queryFn: () =>
      queryFetch<{ favorited: boolean }>(
        `/favorites/status?content_type=${contentType}&content_id=${contentId}`,
      ),
    enabled: !!user,
  });
}

export function useToggleFavorite() {
  const user = useAuthUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentType,
      contentId,
      favorited,
    }: {
      contentType: string;
      contentId: number;
      favorited: boolean;
    }) => {
      const method = favorited ? "DELETE" : "POST";
      const endpoint = favorited ? "/favorites/remove" : "/favorites/add";
      await apiFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_type: contentType, content_id: contentId }),
      });
      return !favorited;
    },
    onSuccess: (_newState, { contentType, contentId }) => {
      if (!user) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.favoriteStatus(user.uid, contentType, contentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.favorites(user.uid),
      });
    },
  });
}

export function useRemoveFromList() {
  const user = useAuthUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      list,
      contentType,
      contentId,
    }: {
      list: "watchlist" | "watched" | "currently-watching";
      contentType: string;
      contentId: number;
    }) => {
      await apiFetch(`/${list}/remove`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_type: contentType, content_id: contentId }),
      });
    },
    onSuccess: (_, { list }) => {
      if (!user) return;
      const keyMap = {
        watchlist: queryKeys.watchlist(user.uid),
        watched: queryKeys.watched(user.uid),
        "currently-watching": queryKeys.currentlyWatching(user.uid),
      };
      queryClient.invalidateQueries({ queryKey: keyMap[list] });
    },
  });
}
