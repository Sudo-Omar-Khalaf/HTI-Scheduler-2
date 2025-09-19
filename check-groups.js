// Test to see available groups for specific courses

const ExcelParserServiceFinal = require('./server/services/ExcelParserServiceFinal');
const path = require('path');

async function checkAvailableGroups() {
  try {
    console.log('🔍 Checking available course groups...');
    
    const parser = new ExcelParserServiceFinal();
    const excelFilePath = path.join(__dirname, 'الجداول الدراسية _ الفصل الدراسي الأول _ قسم الهندسة الكهربية (1).xlsx');
    
    const parseResult = await parser.parseExcelFile(excelFilePath);
    
    // Check EEC 101 and EEC 113 groups
    const targetCourses = ['EEC 101', 'EEC 113'];
    
    targetCourses.forEach(courseCode => {
      console.log(`\n📚 ${courseCode} available groups:`);
      
      const groups = parseResult.course_groups.filter(g => g.course_code === courseCode);
      
      if (groups.length === 0) {
        console.log('  ❌ No groups found');
      } else {
        groups.forEach(group => {
          console.log(`  📖 Group ${group.group_code}:`);
          console.log(`     - Course name: ${group.course_name}`);
          console.log(`     - Sessions: ${group.sessions.length}`);
          group.sessions.forEach((session, i) => {
            console.log(`       ${i+1}. ${session.day_of_week} ${session.start_time} (${session.span} spans)`);
          });
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAvailableGroups();
