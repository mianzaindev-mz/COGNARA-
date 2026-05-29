// src/lib/pdf/generators/chat-export.ts
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#e11d48",
    paddingBottom: 15,
    marginBottom: 20,
  },
  sub: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#6b7280",
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 20,
    color: "#111827",
    fontWeight: "black",
    marginTop: 5,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    fontSize: 9,
    color: "#9ca3af",
  },
  messageCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  userCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  assistantCard: {
    backgroundColor: "#f0f9ff",
    borderColor: "#bae6fd",
  },
  systemCard: {
    backgroundColor: "#f5f3ff",
    borderColor: "#ddd6fe",
  },
  roleBadge: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  userBadge: { color: "#e11d48" },
  assistantBadge: { color: "#0284c7" },
  systemBadge: { color: "#7c3aed" },
  messageText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#374151",
  },
  timestamp: {
    fontSize: 7,
    color: "#9ca3af",
    marginTop: 4,
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#9ca3af",
  },
});

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

interface ChatExportPdfData {
  title: string;
  studentName: string;
  skillName?: string;
  messages: ChatMessage[];
  dateStr?: string;
}

class ChatExportDocument extends React.Component<{ data: ChatExportPdfData }> {
  render() {
    const { data } = this.props;
    const messages = data.messages || [];

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.sub}>
              Agent Conversation Export{data.skillName ? ` · ${data.skillName}` : ""}
            </Text>
            <Text style={styles.title}>{data.title || "AI Chat Transcript"}</Text>
            <View style={styles.meta}>
              <Text>Student: {data.studentName}</Text>
              <Text>
                Exported: {data.dateStr || new Date().toLocaleDateString()} ·{" "}
                {messages.length} messages
              </Text>
            </View>
          </View>

          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            const isAssistant = msg.role === "assistant";

            return (
              <View
                key={i}
                style={[
                  styles.messageCard,
                  isUser
                    ? styles.userCard
                    : isAssistant
                    ? styles.assistantCard
                    : styles.systemCard,
                ]}
              >
                <Text
                  style={[
                    styles.roleBadge,
                    isUser
                      ? styles.userBadge
                      : isAssistant
                      ? styles.assistantBadge
                      : styles.systemBadge,
                  ]}
                >
                  {msg.role === "user"
                    ? "You"
                    : msg.role === "assistant"
                    ? "Cognara AI"
                    : "System"}
                </Text>
                <Text style={styles.messageText}>
                  {(msg.content || "").slice(0, 2000)}
                </Text>
                {msg.timestamp && (
                  <Text style={styles.timestamp}>{msg.timestamp}</Text>
                )}
              </View>
            );
          })}

          <View style={styles.footer} fixed>
            <Text>Cognara · AI Agent Conversation Export</Text>
            <Text
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
            />
          </View>
        </Page>
      </Document>
    );
  }
}

export async function generateChatExportPdf(
  data: ChatExportPdfData
): Promise<Buffer> {
  const element = React.createElement(ChatExportDocument, { data });
  return await renderToBuffer(element as any);
}
