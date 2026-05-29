// src/lib/pdf/generators/quiz-results.ts
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
    borderBottomColor: "#f43f5e", // Brand rose-500
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
    fontSize: 22,
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
  scoreSection: {
    flexDirection: "row",
    backgroundColor: "#fff1f2", // Light rose background
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ffe4e6",
  },
  scoreBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "#e11d48",
    fontWeight: "bold",
    marginBottom: 4,
  },
  scoreVal: {
    fontSize: 24,
    fontWeight: "black",
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 12,
    color: "#e11d48",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginTop: 15,
    marginBottom: 10,
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 4,
  },
  card: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  qText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },
  aRow: {
    flexDirection: "row",
    fontSize: 9,
    marginBottom: 4,
  },
  aLabel: {
    width: 90,
    color: "#6b7280",
  },
  aVal: {
    flex: 1,
    color: "#374151",
  },
  aiFeedback: {
    fontSize: 9,
    lineHeight: 1.4,
    color: "#1e293b",
    backgroundColor: "#f1f5f9",
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
    borderLeftWidth: 2,
    borderLeftColor: "#94a3b8",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bullet: {
    width: 10,
    fontSize: 10,
    color: "#f43f5e",
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.4,
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

interface QuizPdfData {
  quizTitle: string;
  studentName: string;
  rawScore: number;
  maxScore: number;
  percentage: number;
  letterGrade: string;
  gradePoint: number;
  passed: boolean;
  overallFeedback: string;
  strengths: string[];
  areas_for_improvement: string[];
  recommended_resources: string[];
  questionGrades: {
    question_id: string;
    student_answer: string;
    correct_answer: string;
    points_earned: number;
    points_possible: number;
    ai_feedback: string;
  }[];
  dateStr?: string;
}

const QuizResultsDocument = ({ data }: { data: QuizPdfData }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.sub}>Official Academic Performance Report</Text>
          <Text style={styles.title}>{data.quizTitle || "Quiz Assessment Summary"}</Text>
          <View style={styles.meta}>
            <Text>Student: {data.studentName}</Text>
            <Text>Date Evaluated: {data.dateStr || new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Score section */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreLabel}>Final Percentage</Text>
            <Text style={styles.scoreVal}>{data.percentage.toFixed(1)}%</Text>
          </View>
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreLabel}>Letter Grade</Text>
            <Text style={styles.scoreVal}>{data.letterGrade}</Text>
          </View>
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreLabel}>GPA Contribution</Text>
            <Text style={styles.scoreVal}>{data.gradePoint.toFixed(1)} / 4.0</Text>
          </View>
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreLabel}>Status</Text>
            <Text style={[styles.scoreVal, { color: data.passed ? "#10b981" : "#ef4444" }]}>
              {data.passed ? "PASSED" : "FAILED"}
            </Text>
          </View>
        </View>

        {/* Overall feedback */}
        {data.overallFeedback && (
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.sectionTitle}>Instructor / AI Evaluator Assessment</Text>
            <Text style={{ fontSize: 10, lineHeight: 1.5, color: "#374151" }}>{data.overallFeedback}</Text>
          </View>
        )}

        {/* Strengths & Resources */}
        <View style={{ flexDirection: "row", gap: 20, marginBottom: 15 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Identified Strengths</Text>
            {data.strengths?.map((s, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            )) || <Text style={{ fontSize: 9, color: "#9ca3af" }}>None logged.</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Study recommendations</Text>
            {data.recommended_resources?.map((r, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{r}</Text>
              </View>
            )) || <Text style={{ fontSize: 9, color: "#9ca3af" }}>None logged.</Text>}
          </View>
        </View>

        {/* Question Breakdown */}
        <View style={{ marginTop: 10 }}>
          <Text style={styles.sectionTitle}>Detailed Question Breakdown</Text>
          {data.questionGrades?.slice(0, 5).map((q, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.qText}>{`Question ${i + 1}: [Score: ${q.points_earned}/${q.points_possible}]`}</Text>
              <View style={styles.aRow}>
                <Text style={styles.aLabel}>Student Answer:</Text>
                <Text style={styles.aVal}>{q.student_answer || "(No Answer Submitted)"}</Text>
              </View>
              <View style={styles.aRow}>
                <Text style={styles.aLabel}>Correct Answer:</Text>
                <Text style={styles.aVal}>{q.correct_answer}</Text>
              </View>
              {q.ai_feedback && (
                <Text style={styles.aiFeedback}>{q.ai_feedback}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Cognara Next-Gen Learning platform · Official Academic Transcript</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

export async function generateQuizResultsPdf(data: QuizPdfData): Promise<Buffer> {
  return await renderToBuffer(<QuizResultsDocument data={data} />);
}

