export const SUBJECTS = [
  "Mathematics",
  "English Language",
  "Integrated Science",
  "Social Studies",
  "Civic Education",
  "Biology",
  "Chemistry",
  "Physics",
  "Economics",
  "Government",
  "Literature-in-English",
  "Geography",
  "History",
  "Accounting",
  "Commerce",
  "Agricultural Science",
  "French",
  "ICT",
  "Religious and Moral Education",
  "Other",
];

export const CLASS_LEVELS = ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"];

export const RESOURCE_TYPES = [
  { value: "notes", label: "Notes" },
  { value: "past_paper", label: "Past paper" },
  { value: "assignment", label: "Assignment" },
  { value: "textbook", label: "Textbook extract" },
  { value: "lesson_plan", label: "Lesson plan" },
  { value: "other", label: "Other" },
];

export const EXAM_YEARS = Array.from({ length: 16 }, (_, i) => String(2012 + i));

export function typeLabel(value) {
  return RESOURCE_TYPES.find((item) => item.value === value)?.label || value || "Resource";
}
