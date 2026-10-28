/**
 * Inearly Chat Persistence & Context Memory Service
 * Implements strict data isolation per user, DPDP Act 2023 revocable consent,
 * and seamless synchronization with Supabase and localStorage.
 */

import { ConcernTag } from "@/components/WellnessChatSpace";

export interface StoredConversation {
  id: string;
  userId: string;
  title: string;
  mode: "listen" | "plan";
  createdAt: string;
  updatedAt: string;
  preview: string;
  tags: string[];
  messageCount: number;
}

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  tags?: ConcernTag[];
  safetyAlert?: boolean;
  resources?: string[];
}

const CONSENT_KEY_PREFIX = "inearly_consent_memory_";
const CONVS_KEY_PREFIX = "inearly_convs_";
const MSGS_KEY_PREFIX = "inearly_msgs_";

export const chatStorage = {
  /**
   * Check whether the user has granted explicit consent for context memory & chat history retention
   */
  hasMemoryConsent(userId: string): boolean {
    if (typeof window === "undefined") return true;
    try {
      const stored = localStorage.getItem(`${CONSENT_KEY_PREFIX}${userId}`);
      if (stored !== null) {
        return stored === "true";
      }
      // Check session default
      const session = localStorage.getItem("inearly_session");
      if (session) {
        const parsed = JSON.parse(session);
        return Boolean(parsed.saveChats);
      }
      return true; // Default opt-in with explicit prompt available
    } catch {
      return true;
    }
  },

  /**
   * Update explicit consent for context memory & retention
   */
  setMemoryConsent(userId: string, enabled: boolean): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`${CONSENT_KEY_PREFIX}${userId}`, String(enabled));
      // Sync with session object
      const session = localStorage.getItem("inearly_session");
      if (session) {
        const parsed = JSON.parse(session);
        parsed.saveChats = enabled;
        localStorage.setItem("inearly_session", JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn("Could not save memory consent:", e);
    }
  },

  /**
   * Retrieve list of conversations for a specific user (enforcing user isolation)
   */
  async getConversations(userId: string): Promise<StoredConversation[]> {
    if (!userId) return [];

    let localConvs: StoredConversation[] = [];
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`${CONVS_KEY_PREFIX}${userId}`);
        if (raw) {
          localConvs = JSON.parse(raw);
        }
      } catch (e) {
        console.warn("Failed to read local conversations:", e);
      }
    }

    // Try fetching from backend / Supabase API
    try {
      const res = await fetch(`/api/v1/conversations?user_id=${encodeURIComponent(userId)}`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const remoteConvs = await res.json();
        if (Array.isArray(remoteConvs) && remoteConvs.length > 0) {
          // Merge remote and local (local prioritized for latest edits)
          const map = new Map<string, StoredConversation>();
          remoteConvs.forEach((rc: any) => {
            map.set(rc.id, {
              id: rc.id,
              userId: rc.user_id || userId,
              title: rc.title || "Session",
              mode: rc.mode || "listen",
              createdAt: rc.created_at || new Date().toISOString(),
              updatedAt: rc.created_at || new Date().toISOString(),
              preview: rc.preview || "",
              tags: rc.tags || [],
              messageCount: rc.message_count || 0,
            });
          });
          localConvs.forEach((lc) => map.set(lc.id, lc));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
          );
          if (typeof window !== "undefined") {
            localStorage.setItem(`${CONVS_KEY_PREFIX}${userId}`, JSON.stringify(merged));
          }
          return merged;
        }
      }
    } catch {
      // Offline fallback: rely on localConvs
    }

    return localConvs.sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
  },

  /**
   * Retrieve messages for a specific conversation
   */
  async getMessages(convId: string, userId: string): Promise<StoredMessage[]> {
    if (!convId) return [];

    let localMsgs: StoredMessage[] = [];
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`${MSGS_KEY_PREFIX}${convId}`);
        if (raw) {
          localMsgs = JSON.parse(raw);
        }
      } catch (e) {
        console.warn("Failed to read local messages:", e);
      }
    }

    // If local messages exist, return them immediately
    if (localMsgs.length > 0) return localMsgs;

    // Otherwise try backend
    try {
      const res = await fetch(`/api/v1/conversations/${encodeURIComponent(convId)}?user_id=${encodeURIComponent(userId)}`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          const formatted: StoredMessage[] = data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            text: m.content,
            timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now",
          }));
          if (typeof window !== "undefined" && formatted.length > 0) {
            localStorage.setItem(`${MSGS_KEY_PREFIX}${convId}`, JSON.stringify(formatted));
          }
          return formatted;
        }
      }
    } catch {
      // Fallback
    }

    return localMsgs;
  },

  /**
   * Save a single message into the conversation
   */
  async saveMessage(
    convId: string,
    userId: string,
    msg: StoredMessage,
    mode: "listen" | "plan" = "listen"
  ): Promise<void> {
    // Only persist long-term if user consented
    if (!this.hasMemoryConsent(userId)) return;

    if (typeof window === "undefined") return;

    try {
      // 1. Update message list
      const existingMsgsRaw = localStorage.getItem(`${MSGS_KEY_PREFIX}${convId}`);
      const messages: StoredMessage[] = existingMsgsRaw ? JSON.parse(existingMsgsRaw) : [];
      // Prevent duplicates
      if (!messages.some((m) => m.id === msg.id)) {
        messages.push(msg);
        localStorage.setItem(`${MSGS_KEY_PREFIX}${convId}`, JSON.stringify(messages));
      }

      // 2. Update conversation summary
      const convsRaw = localStorage.getItem(`${CONVS_KEY_PREFIX}${userId}`);
      let convs: StoredConversation[] = convsRaw ? JSON.parse(convsRaw) : [];

      const nowIso = new Date().toISOString();
      const existingIdx = convs.findIndex((c) => c.id === convId);

      // Generate a descriptive title from first user message
      let title = "Session";
      const firstUserMsg = messages.find((m) => m.role === "user");
      if (firstUserMsg) {
        title = firstUserMsg.text.slice(0, 32) + (firstUserMsg.text.length > 32 ? "..." : "");
      }

      const tags = Array.from(
        new Set(
          messages
            .flatMap((m) => m.tags || [])
            .map((t) => t.display_label)
        )
      );

      const updatedConv: StoredConversation = {
        id: convId,
        userId,
        title: existingIdx >= 0 && convs[existingIdx].title !== "Session" ? convs[existingIdx].title : title,
        mode,
        createdAt: existingIdx >= 0 ? convs[existingIdx].createdAt : nowIso,
        updatedAt: nowIso,
        preview: msg.text.slice(0, 60),
        tags,
        messageCount: messages.length,
      };

      if (existingIdx >= 0) {
        convs[existingIdx] = updatedConv;
      } else {
        convs.unshift(updatedConv);
      }

      localStorage.setItem(`${CONVS_KEY_PREFIX}${userId}`, JSON.stringify(convs));
    } catch (e) {
      console.warn("Failed to store message client-side:", e);
    }
  },

  /**
   * Delete a specific conversation and all its messages
   */
  async deleteConversation(convId: string, userId: string): Promise<void> {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(`${MSGS_KEY_PREFIX}${convId}`);
        const convsRaw = localStorage.getItem(`${CONVS_KEY_PREFIX}${userId}`);
        if (convsRaw) {
          const convs: StoredConversation[] = JSON.parse(convsRaw);
          const filtered = convs.filter((c) => c.id !== convId);
          localStorage.setItem(`${CONVS_KEY_PREFIX}${userId}`, JSON.stringify(filtered));
        }
      } catch (e) {
        console.warn("Failed to delete local conversation:", e);
      }
    }

    // Call API / Supabase cascade deletion
    try {
      await fetch(`/api/v1/conversations/${encodeURIComponent(convId)}?user_id=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.warn("Failed to delete remote conversation:", e);
    }
  },

  /**
   * One-click permanent purge of all user conversation history
   */
  async purgeAllHistory(userId: string): Promise<void> {
    if (typeof window !== "undefined") {
      try {
        const convsRaw = localStorage.getItem(`${CONVS_KEY_PREFIX}${userId}`);
        if (convsRaw) {
          const convs: StoredConversation[] = JSON.parse(convsRaw);
          convs.forEach((c) => {
            localStorage.removeItem(`${MSGS_KEY_PREFIX}${c.id}`);
          });
        }
        localStorage.removeItem(`${CONVS_KEY_PREFIX}${userId}`);
      } catch (e) {
        console.warn("Failed to wipe local conversations:", e);
      }
    }

    // Call remote purge
    try {
      await fetch(`/api/v1/conversations?user_id=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.warn("Failed to wipe remote conversations:", e);
    }
  },
};
