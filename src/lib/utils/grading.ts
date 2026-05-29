export function getStandardGradeScale() {
  return [
    { letter: "A+", min_pct: 95, max_pct: 100, grade_point: 4.0, label: "Exceptional" },
    { letter: "A",  min_pct: 90, max_pct: 94,  grade_point: 4.0, label: "Excellent" },
    { letter: "A-", min_pct: 87, max_pct: 89,  grade_point: 3.7, label: "Very Good" },
    { letter: "B+", min_pct: 83, max_pct: 86,  grade_point: 3.3, label: "Good" },
    { letter: "B",  min_pct: 80, max_pct: 82,  grade_point: 3.0, label: "Above Average" },
    { letter: "B-", min_pct: 77, max_pct: 79,  grade_point: 2.7, label: "Average" },
    { letter: "C+", min_pct: 73, max_pct: 76,  grade_point: 2.3, label: "Below Average" },
    { letter: "C",  min_pct: 70, max_pct: 72,  grade_point: 2.0, label: "Satisfactory" },
    { letter: "C-", min_pct: 67, max_pct: 69,  grade_point: 1.7, label: "Needs Improvement" },
    { letter: "D",  min_pct: 60, max_pct: 66,  grade_point: 1.0, label: "Marginal Pass" },
    { letter: "F",  min_pct: 0,  max_pct: 59,  grade_point: 0.0, label: "Fail" }
  ];
}
