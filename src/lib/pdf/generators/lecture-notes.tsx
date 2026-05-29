// src/lib/pdf/generators/lecture-notes.ts
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

// Professional HSL-derived palette styling
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#e11d48", // Brand rose-600
    paddingBottom: 15,
    marginBottom: 20,
  },
  courseTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#6b7280",
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  lectureTitle: {
    fontSize: 22,
    color: "#111827",
    fontWeight: "black",
    marginTop: 5,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    fontSize: 9,
    color: "#9ca3af",
  },
  sectionTitle: {
    fontSize: 13,
    color: "#e11d48",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: 1,
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#374151",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#e11d48",
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 10,
  },
  bullet: {
    width: 10,
    fontSize: 10,
    color: "#e11d48",
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.4,
    color: "#4b5563",
  },
  termRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 6,
  },
  termKey: {
    width: 120,
    fontSize: 10,
    fontWeight: "bold",
    color: "#1f2937",
  },
  termVal: {
    flex: 1,
    fontSize: 10,
    color: "#4b5563",
    lineHeight: 1.4,
  },
  markdownParagraph: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#374151",
    marginBottom: 10,
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

interface NotesPdfData {
  title: string;
  summary: string;
  key_points: string[];
  key_terms: Record<string, string>;
  full_notes_md: string;
  courseTitle?: string;
  studentName?: string;
  dateStr?: string;
}

// React-PDF Document Component
class LectureNotesDocument extends React.Component<{ data: NotesPdfData }> {
  render() {
    const { data } = this.props;
    const points = data.key_points || [];
    const terms = Object.entries(data.key_terms || {});
    
    // Simple markdown paragraph splitter
    const mdParagraphs = (data.full_notes_md || "")
      .split("\n\n")
      .map(p => p.replace(/[#*`_-]/g, "").trim())
      .filter(p => p.length > 10);

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.courseTitle}>{data.courseTitle || "Cognara Interactive Study Notes"}</Text>
            <Text style={styles.lectureTitle}>{data.title || "Lecture Highlights"}</Text>
            <View style={styles.metaRow}>
              <Text>Student: {data.studentName || "Cognara Learner"}</Text>
              <Text>Generated: {data.dateStr || new Date().toLocaleDateString()}</Text>
            </View>
          </View>

          {/* AI Summary */}
          {data.summary && (
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.sectionTitle}>Executive Summary</Text>
              <Text style={styles.summaryText}>{data.summary}</Text>
            </View>
          )}

          {/* Key Insights */}
          {points.length > 0 && (
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.sectionTitle}>Key takeaways</Text>
              {points.map((pt, i) => (
                <View key={i} style={styles.bulletPoint}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{pt}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Key Terms */}
          {terms.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.sectionTitle}>Glossary & Concepts</Text>
              {terms.map(([key, val], i) => (
                <View key={i} style={styles.termRow}>
                  <Text style={styles.termKey}>{key}</Text>
                  <Text style={styles.termVal}>{val}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Detailed Study Notes */}
          {mdParagraphs.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Detailed Study Guide</Text>
              {mdParagraphs.slice(0, 12).map((p, i) => (
                <Text key={i} style={styles.markdownParagraph}>{p}</Text>
              ))}
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer} fixed>
            <Text>Cognara Next-Gen Learning platform · Lecture Study Notes</Text>
            <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          </View>
        </Page>
      </Document>
    );
  }
}

/**
 * generateLectureNotesPdf
 * Compiles a structured, harmoniously colored PDF document from lecture notes
 */
export async function generateLectureNotesPdf(data: NotesPdfData): Promise<Buffer> {
  const element = React.createElement(LectureNotesDocument, { data });
  const buffer = await renderToBuffer(element as any);
  return buffer;
}
