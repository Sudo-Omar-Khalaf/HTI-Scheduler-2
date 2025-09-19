// Test script to simulate uploaded data in sessionStorage
// Run this in browser console to test /schedule page directly

const mockData = {
  course_groups: [
    {
      course_code: "EEC 113",
      group_code: "01",
      course_name: "هندسة الحاسبات (1)",
      sessions: [
        {
          day_of_week: "Saturday",
          start_time: "9.00",
          end_time: "12.10",
          location: "معمل 1",
          instructor: "د. محمد عوني",
          session_type: "lecture",
          span: 4
        }
      ]
    },
    {
      course_code: "EEC 101",
      group_code: "05",
      course_name: "مبادئ هندسة كهربية",
      sessions: [
        {
          day_of_week: "Sunday",
          start_time: "9.00",
          end_time: "12.10",
          location: "معمل 2",
          instructor: "د. أحمد علي",
          session_type: "lecture",
          span: 4
        }
      ]
    }
  ],
  schedule_entries: [],
  span_statistics: {},
  parsing_summary: {
    total_entries: 2,
    course_codes_found: 2,
    groups_found: 2
  }
};

// Add to sessionStorage
sessionStorage.setItem('uploadResults', JSON.stringify(mockData));

console.log('✅ Mock data added to sessionStorage');
console.log('🔄 Now refresh http://localhost:5173/schedule to test');
