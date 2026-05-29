// src/lib/pdf/generators/grade-report.ts
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
    borderBottomWidth: 3,
    borderBottomColor: "#e11d48",
    paddingBottom: 15,
    marginBottom: 25,
  },
  institution: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#e11d48",
    fontWeight: "bold",
    letterSpacing: 2,
  },
  title: {
    fontSize: 24,
    color: "#111827",
    fontWeight: "black",
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    fontSize: 9,
    color: "#6b7280",
  },
  summarySection: {
    flexDirection: "row",
    backgroundColor: "#fff1f2",
    padding: 16,
    borderRadius: 10,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#ffe4e6",
  },
  summaryBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#be123c",
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "black",
    color: "#111827",
  },
  divider: {
    width: 1,
    backgroundColor: "#fecaca",
    marginHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 12,
    color: "#e11d48",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginTop: 15,
    marginBottom: 10,
    letterSpacing: 1,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    padding: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 8,
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: "#374151",
  },
  tableCellBold: {
    flex: 1,
    fontSize: 9,
    color: "#111827",
    fontWeight: "bold",
  },
  passCell: { color: "#059669" },
  failCell: { color: "#dc2626" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#9ca3af",
  },
  seal: {
    marginTop: 30,
    padding: 12,
    borderWidth: 2,
    borderColor: "#e11d48",
    borderRadius: 8,
    alignItems: "center",
  },
  sealText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#e11d48",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  sealSub: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 4,
  },
});

interface GradeEntry {
  quizTitle: string;
  courseTitle: string;
  percentage: number;
  letterGrade: string;
  gradePoint: number;
  passed: boolean;
  gradedAt: string;
}

interface GradeReportPdfData {
  studentName: string;
  studentEmail?: string;
  cumulativeGPA: number;
  totalQuizzes: number;
  totalPassed: number;
  averagePercentage: number;
  grades: GradeEntry[];
  dateStr?: string;
}

const GradeReportDocument = ({ data }: { data: GradeReportPdfData }) => {
  const passRate =
    data.totalQuizzes > 0
      ? Math.round((data.totalPassed / data.totalQuizzes) * 100)
      : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.institution}>Cognara Academy</Text>
          <Text style={styles.title}>Official Academic Transcript</Text>
          <View style={styles.metaRow}>
            <Text>
              Student: {data.studentName}
              {data.studentEmail ? ` (${data.studentEmail})` : ""}
            </Text>
            <Text>
              Date: {data.dateStr || new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Summary Cards Row */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Cumulative GPA</Text>
            <Text style={styles.summaryValue}>
              {data.cumulativeGPA.toFixed(2)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Average Score</Text>
            <Text style={styles.summaryValue}>
              {data.averagePercentage.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Total Evaluated</Text>
            <Text style={styles.summaryValue}>{data.totalQuizzes}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Pass Rate</Text>
            <Text style={styles.summaryValue}>{passRate}%</Text>
          </View>
        </View>

        {/* Detailed Grade Table */}
        <Text style={styles.sectionTitle}>Detailed Assessment Records</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 2.5 }]}>Quiz</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Course</Text>
          <Text style={styles.tableHeaderText}>Score</Text>
          <Text style={styles.tableHeaderText}>Grade</Text>
          <Text style={styles.tableHeaderText}>GPA</Text>
          <Text style={styles.tableHeaderText}>Status</Text>
          <Text style={styles.tableHeaderText}>Date</Text>
        </View>

        {/* Table Rows */}
        {data.grades.map((g, i) => (
          <View
            key={i}
            style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
          >
            <Text style={[styles.tableCellBold, { flex: 2.5 }]}>
              {g.quizTitle}
            </Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>
              {g.courseTitle}
            </Text>
            <Text style={styles.tableCell}>{g.percentage.toFixed(1)}%</Text>
            <Text style={styles.tableCellBold}>{g.letterGrade}</Text>
            <Text style={styles.tableCell}>{g.gradePoint.toFixed(1)}</Text>
            <Text
              style={[
                styles.tableCellBold,
                g.passed ? styles.passCell : styles.failCell,
              ]}
            >
              {g.passed ? "PASS" : "FAIL"}
            </Text>
            <Text style={styles.tableCell}>
              {g.gradedAt
                ? new Date(g.gradedAt).toLocaleDateString()
                : "—"}
            </Text>
          </View>
        ))}

        {/* Official Seal */}
        <View style={styles.seal}>
          <Text style={styles.sealText}>Verified Academic Record</Text>
          <Text style={styles.sealSub}>
            Cognara AI-Assisted Grading System ·{" "}
            {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            Cognara Next-Gen Learning · Official Grade Report
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};

export async function generateGradeReportPdf(
  data: GradeReportPdfData
): Promise<Buffer> {
  return await renderToBuffer(<GradeReportDocument data={data} />);
}

