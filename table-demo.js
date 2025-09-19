// Simple test to demonstrate weekly table output

const ExcelParserServiceFinal = require("./server/services/ExcelParserServiceFinal");
const ScheduleGeneratorService = require("./server/services/ScheduleGeneratorService");
const path = require("path");

async function demonstrateWeeklyTable() {
  try {
    console.log("📅 Demonstrating Weekly Table Output\n");

    const parser = new ExcelParserServiceFinal();
    const excelFilePath = path.join(__dirname, "الجداول الدراسية _ الفصل الدراسي الأول _ قسم الهندسة الكهربية (1).xlsx");
    
    const parseResult = await parser.parseExcelFile(excelFilePath);
    const generator = new ScheduleGeneratorService();

    console.log("🧪 Generating schedule for EEC 11301, EEC 10105");
    const result = await generator.generatePersonalizedSchedule(
      parseResult.course_groups,
      { desired_courses: ["EEC 11301", "EEC 10105"] }
    );

    if (result.success) {
      console.log("\n✅ Generation successful!");
      console.log("📊 Total spans:", result.schedule.generation_metadata.total_spans);
      console.log("�� Course selection count:", result.schedule.course_selection.length);
      
      console.log("\n📋 WEEKLY SCHEDULE TABLE (7 days × 8 time slots):");
      console.log("=".repeat(60));
      
      const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      const timeSlots = ["8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00"];
      
      for (let day = 0; day < 7; day++) {
        console.log(`\n📅 ${days[day]}:`);
        let hasContent = false;
        for (let slot = 0; slot < 8; slot++) {
          const cell = result.schedule.weekly_table.schedule[days[day]][slot];
          if (cell) {
            console.log(`  ${timeSlots[slot]}: ${cell}`);
            hasContent = true;
          }
        }
        if (!hasContent) {
          console.log("  (No classes scheduled)");
        }
      }
      
      console.log("\n" + "=".repeat(60));
      console.log("✅ Weekly table demonstration completed!");
      
    } else {
      console.log("❌ Generation failed:", result.error);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

demonstrateWeeklyTable();
