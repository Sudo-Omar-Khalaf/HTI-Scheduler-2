
// Test to show weekly table output

const ExcelParserServiceFinal = require("./server/services/ExcelParserServiceFinal");
const ScheduleGeneratorService = require("./server/services/ScheduleGeneratorService");
const path = require("path");

async function showWeeklyTable() {
  try {
    console.log("📅 Showing weekly table output example...
");

    const parser = new ExcelParserServiceFinal();
    const excelFilePath = path.join(__dirname, "الجداول الدراسية _ الفصل الدراسي الأول _ قسم الهندسة الكهربية (1).xlsx");
    
    console.log("📂 Parsing Excel file...");
    const parseResult = await parser.parseExcelFile(excelFilePath);

    const generator = new ScheduleGeneratorService();

    console.log("🧪 Generating schedule for EEC 11301, EEC 10105");
    const result = await generator.generatePersonalizedSchedule(
      parseResult.course_groups,
      { desired_courses: ["EEC 11301", "EEC 10105"] }
    );

    if (result.success) {
      console.log("\n📋 Weekly Schedule Table (7 days × 8 time slots):");
      console.log("Format: [Day][Time Slot] = Course Info");
      console.log();

      const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      const timeSlots = ["8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00"];

      for (let day = 0; day < 7; day++) {
        console.log(\`📅 \${days[day]}:\`);
        for (let slot = 0; slot < 8; slot++) {
          const cell = result.schedule.weekly_table[day][slot];
          if (cell && cell.trim()) {
            console.log(\`  \${timeSlots[slot]}: \${cell}\`);
          }
        }
        console.log();
      }
    } else {
      console.log("❌ Generation failed:", result.error);
    }

  } catch (error) {
    console.error("❌ Test error:", error);
  }
}

showWeeklyTable();
