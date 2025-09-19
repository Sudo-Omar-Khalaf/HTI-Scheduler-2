const mockCourseGroups = [
  {
    course_code: "EEC 101",
    group_code: "01",
    course_name: "الدوائر الكهربية الأساسية",
    sessions: [
      {
        session_type: "محاضرة",
        day_of_week: "Sunday",
        start_time: "9.00",
        end_time: "10.30",
        span: 2,
        location: "A101",
        instructor: "د. أحمد محمد"
      },
      {
        session_type: "معمل",
        day_of_week: "Tuesday",
        start_time: "11.25",
        end_time: "12.10",
        span: 1,
        location: "LAB1",
        instructor: "م. سارة أحمد"
      }
    ]
  },
  {
    course_code: "EEC 113",
    group_code: "01", 
    course_name: "الرياضيات الهندسية",
    sessions: [
      {
        session_type: "محاضرة",
        day_of_week: "Monday",
        start_time: "9.00",
        end_time: "10.30",
        span: 2,
        location: "B202",
        instructor: "د. فاطمة علي"
      },
      {
        session_type: "معمل",
        day_of_week: "Wednesday",
        start_time: "12.20",
        end_time: "1.05",
        span: 1,
        location: "LAB2",
        instructor: "م. خالد حسن"
      }
    ]
  }
];

const userRequest = {
  desired_courses: ["EEC 101", "EEC 113"]
};

module.exports = { mockCourseGroups, userRequest };
